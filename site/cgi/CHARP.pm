# This file is part of the CHARP project.  -*- tab-width: 4; -*-
#
# Copyright © 2011 - 2014
#   Free Software Foundation Europe, e.V.,
#   Talstrasse 110, 40217 Dsseldorf, Germany
#
# Licensed under the EUPL V.1.1. See the file LICENSE.txt for copying conditions.

package CHARP;

use strict;

use DBI qw(:sql_types);

#use Data::Dumper;
use Encode qw(encode decode);
use CGI::Fast qw(:cgi);
use JSON::XS;
use utf8;

require "CHARP-cmd.pm";
require "CHARP-config.pm";
require "CHARP-strings-$CHARP::CHARP_LANG.pm";
require "CHARP-$CHARP::DB_DRIVER.pm";

%CHARP::ERROR_LEVELS = (
	'DATA' => 1,
	'SQL'  => 2,
	'DBI'  => 3,
	'CGI'  => 4,
	'HTTP' => 5
);

$CHARP::ERROR_SEV_INTERNAL	= 1;
$CHARP::ERROR_SEV_PERM		= 2;
$CHARP::ERROR_SEV_RETRY		= 3;
$CHARP::ERROR_SEV_USER		= 4;
$CHARP::ERROR_SEV_EXIT		= 5;

# Last error code is 25.
%CHARP::ERRORS = (
	'DBI:CONNECT'		=> { 'code' =>  1, 'sev' => $CHARP::ERROR_SEV_RETRY	   },
	'DBI:PREPARE'		=> { 'code' =>  2, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'DBI:EXECUTE'		=> { 'code' =>  3, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:REQPARM'		=> { 'code' =>  4, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:NOTPOST'		=> { 'code' =>  7, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:PATHUNK'		=> { 'code' =>  8, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:BADPARAM'	    => { 'code' => 11, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:NUMPARAM'	    => { 'code' => 12, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:BINDPARAM'	    => { 'code' => 16, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:FILESEND'	    => { 'code' => 19, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:CMDUNK'		=> { 'code' => 22, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:CMDNUMPARAM'	=> { 'code' => 23, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'CGI:CMDERR'		=> { 'code' => 24, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'SQL:USERUNK'		=> { 'code' =>  5, 'sev' => $CHARP::ERROR_SEV_USER	   },
	'SQL:USERDIS'		=> { 'code' =>  5, 'sev' => $CHARP::ERROR_SEV_PERM	   },
	'SQL:PROCUNK'		=> { 'code' =>  6, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'SQL:REQUNK'		=> { 'code' =>  9, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'SQL:REPFAIL'		=> { 'code' => 10, 'sev' => $CHARP::ERROR_SEV_USER	   },
	'SQL:ASSERT'		=> { 'code' => 13, 'sev' => $CHARP::ERROR_SEV_INTERNAL },
	'SQL:USERPARAMPERM' => { 'code' => 14, 'sev' => $CHARP::ERROR_SEV_PERM	   },
	'SQL:USERPERM'	    => { 'code' => 15, 'sev' => $CHARP::ERROR_SEV_PERM	   },
	'SQL:MAILFAIL'	    => { 'code' => 17, 'sev' => $CHARP::ERROR_SEV_USER	   },
	'SQL:DATADUP'		=> { 'code' => 20, 'sev' => $CHARP::ERROR_SEV_USER	   },
	'SQL:NOTFOUND'	    => { 'code' => 21, 'sev' => $CHARP::ERROR_SEV_USER	   },
	'SQL:EXIT'		    => { 'code' => 18, 'sev' => $CHARP::ERROR_SEV_EXIT	   },
	'SQL:SUCCESS'		=> { 'code' => 25, 'sev' => $CHARP::ERROR_SEV_EXIT	   }
);

foreach my $key (keys %CHARP::ERRORS) {
	my $lvl = (split (':', $key))[0];
	my $err = $CHARP::ERRORS{$key};
	$err->{'type'} = substr ($key, index ($key, ':') + 1);
	$err->{'desc'} = $CHARP::ERROR_DESCS{$key};
	$err->{'level'} = $CHARP::ERROR_LEVELS{$lvl};
	$err->{'key'} = $key;
}

%CHARP::STATESTR_TO_TYPE = (
	'unique_violation' => $CHARP::ERRORS{'SQL:DATADUP'}
	);

sub init {
	my $dbh = shift;

	my $err_sth = $dbh->prepare (call_procedure_query ('charp_log_error (?, ?, ?, ?, ?, ?, ?)'), prepare_attrs ());
	if (!defined $err_sth) {
		dispatch_error ({ 'key' => 'DBI:PREPARE', 'msg' => $DBI::errstr });
		return;
	}

	$err_sth->bind_param (1, undef, SQL_INTEGER); # request_id
	$err_sth->bind_param (2, undef, SQL_VARCHAR); # type
	$err_sth->bind_param (3, undef, SQL_VARCHAR); # login
	$err_sth->bind_param (4, undef, sql_inet_type ()); # ip_addr
	$err_sth->bind_param (5, undef, SQL_VARCHAR); # resource
	$err_sth->bind_param (6, undef, sql_params_type ()); # params
	$err_sth->bind_param (7, undef, SQL_VARCHAR); # status

	my $chal_sth = $dbh->prepare ('SELECT charp_request_create (?, ?, ?, ?) AS chal', prepare_attrs ());
	if (!defined $chal_sth) {
		dispatch_error ({ 'key' => 'DBI:PREPARE', 'msg' => $DBI::errstr });
		return;
	}

	$chal_sth->bind_param (1, undef, SQL_VARCHAR); # login
	$chal_sth->bind_param (2, undef, sql_inet_type ()); # ip_addr
	$chal_sth->bind_param (3, undef, SQL_VARCHAR); # resource
	$chal_sth->bind_param (4, undef, sql_params_type ()); # params

	my $chk_sth = $dbh->prepare (call_procedure_query ('charp_request_check (?, ?, ?, ?)'), prepare_attrs ());
	if (!defined $chk_sth) {
		dispatch_error ({ 'key' => 'DBI:PREPARE', 'msg' => $DBI::errstr });
		return;
	}

	$chk_sth->bind_param (1, undef, SQL_VARCHAR); # login
	$chk_sth->bind_param (2, undef, sql_inet_type ()); # ip_addr
	$chk_sth->bind_param (3, undef, SQL_VARCHAR); # chal
	$chk_sth->bind_param (4, undef, SQL_VARCHAR); # hash

	my $func_sth = $dbh->prepare ('SELECT charp_function_params (?) AS fparams', prepare_attrs ());
	if (!defined $func_sth) {
		dispatch_error ({ 'key' => 'DBI:PREPARE', 'msg' => $DBI::errstr });
		return;
	}

	$func_sth->bind_param (1, undef, SQL_VARCHAR); # fname

	my $ctx = { 
		'dbh'	   => $dbh, 
		'chal_sth' => $chal_sth,
		'chk_sth'  => $chk_sth,
		'func_sth' => $func_sth,
		'err_sth'  => $err_sth
	};

	$CHARP::ctx = $ctx;
	return $ctx;
}

# For testing, add ->pretty.
$CHARP::JSON = JSON::XS->new;

sub json_print_headers {
	my $fcgi = shift;

	print $fcgi->header (-type => 'application/json',
						 -expires => 'now',
						 -charset => 'UTF-8'
		);
}

sub json_encode {
	return encode ('UTF-8', $CHARP::JSON->encode (shift));
}

sub json_decode {
	return $CHARP::JSON->decode (shift);
}

sub json_send {
	my $fcgi = shift;
	my $struct = shift;

	json_print_headers ($fcgi);
	print json_encode ($struct);
}

sub error_send {
	my $fcgi = shift;
	my $ctx = shift;

	my $err_key = $ctx->{'key'};
	my $msg = $ctx->{'msg'};
	my $parms = $ctx->{'parms'};
	my $state = $ctx->{'state'};
	my $statestr = $ctx->{'statestr'};
	my $objs = $ctx->{'objs'};

	$parms = undef if defined $parms && scalar (@$parms) < 0;

	my %err = %{$CHARP::ERRORS{$err_key}};
	if (defined $parms) {
		$err{'desc'} = sprintf ($err{'desc'}, @$parms);
	}
	if (defined $msg) {
		$err{'msg'} = $msg;
	}
	if (defined $state) {
		$err{'state'} = $state;
	}
	$err{'statestr'} = (defined $statestr)? $statestr: $err_key;

	if (ref $objs eq 'ARRAY' && scalar (@$objs) > 0) {
		$err{'objs'} = $objs;
	}

	json_send ($fcgi, { 'error' => \%err });
	return;
}

sub parse_csv {
	my $text = shift;
	my @new = ();

	while ($text =~ m{
	'([^\'\\]*(?:(?:\\.|'')[^\'\\]*)*)',?
	  | ([^,]+),?
	  | ,
	}gx) {
		my $l = $+;
		$l =~ s/''/'/g;
		push (@new, $l);
	}

	push (@new, undef) if substr ($text, -1,1) eq ',';
	return @new;
}

sub raise_parse {
	my $raisestr = shift;

	my $err = {};

	my @fields = split ('\|', $raisestr);

	if (substr ($fields[1], 1, 1) eq '-') {
		$err->{'type'} = substr ($fields[1], 2);
	} else {
		$err->{'dolog'} = 1;
		$err->{'type'} = substr ($fields[1], 1);
	}

	my $parms_str = $fields[2];
	if ($parms_str eq '') {
		$err->{'parms_str'} = '[]';
		$err->{'parms'} = [];
	} else {
		$err->{'parms_str'} = $parms_str;
		$err->{'parms'} = $CHARP::JSON->decode ($parms_str);
	}

	$err->{'key'} = 'SQL:' . $err->{'type'};
	$err->{'msg'} = substr ($fields[2], length ($err->{'parms_str'}) + 2);
	$err->{'objs'} = [$err->{'msg'} =~ /'([^']+)'/g];

	return $err;
}

sub error_get {
	my $sth = shift;
	my $dbh = shift;

	my $err;

	my $errstr = $sth->errstr;
	$errstr =~ s/^ERROR:\s+//; # PostgreSQL 9.6 prepends the error string with this.

	if (substr ($errstr, 0, 2) eq '|>') { 
		# Probably an exception raised by us (charp_raise).
		return raise_parse ($sth->errstr);
	}

	# Execute error, not raised by us.
	my %err_hash;

	my $statestr = db_state_str ($sth, $dbh);
	if (exists $CHARP::STATESTR_TO_TYPE{$statestr}) {
		%err_hash = %{$CHARP::STATESTR_TO_TYPE{$statestr}};
	} else {
		%err_hash = (
			'type' => 'EXECUTE',
			'key' => 'DBI:EXECUTE',
			'msg' => $sth->errstr,
			'parms_str' => ''
			);
	}

	$err = \%err_hash;
	$err->{'msg'} =~ /^([^\n]+)/;
	my $objstr = $1;
	$err->{'objs'} = [$objstr =~ /"([^"]+)"/g];

	return $err;
}

sub error_log {
	my ($request_id, $err, $login, $ip_addr, $res, $status) = @_;

	# if we can't communicate with the server, doesn't make sense to try to log the error.
	return if error_is_fatal ($CHARP::ctx->{'err_sth'});

	$CHARP::ctx->{'err_sth'}->execute ($request_id, $err->{'type'}, $login, 
									   $ip_addr, $res, $err->{'parms_str'}, $status);
}

sub error_execute_send {
	my ($dbh, $fcgi, $sth, $login, $ip_addr, $res, $request_id, $err) = @_;

	$err = error_get ($sth, $dbh) if !$err;

	if ($err->{'dolog'}) {
		error_log ($request_id, $err, $login, $ip_addr, $res, 'exception');
	}

	error_send ($fcgi,
				{
					'key' => $err->{'key'}, 
					'msg' => $err->{'msg'}, 
					'parms' => $err->{'parms'}, 
					'state' => db_state_num ($sth, $dbh), 
					'statestr' => db_state_str ($sth, $dbh),
					'objs' => $err->{'objs'}
				});
}

sub error_is_fatal {
	my $sth = shift;

	if (db_err ($sth) == 7) { # A fatal error was returned: the last query failed.
		my $state = db_state_num ($sth);
		my $class = substr ($state, 0, 2);
		if ($state eq '08') { # Problem with the connection.
			return 1;
		}
	}

	return;
}

sub dispatch_error {
	my $ctx = shift;
	dispatch (sub { error_send (@_); return 1; }, $ctx);
}

#
#sub fcgi_bail {
#	my $data = shift;
#	my $inside_dispatch = shift;
#
#	CGI::Fast->new if !$inside_dispatch;
#	print "\n" . Dumper ($data) . "\n";
#	exit;
#}

# Wait for requests, call dispatcher callback and loop.
sub dispatch {
	my $callback = shift;
	my $ctx = shift;

	while (my $fcgi = CGI::Fast->new) {
		if (!$ctx->{'dbh'}->ping ()) {
			$ctx = CHARP::connect ();
		}
		my $res = &$callback ($fcgi, $ctx);
		last if defined $res;
	}
}

sub connect {
	my ($attr_hash) = @_;

	$attr_hash = {} if (!defined $attr_hash);
	$attr_hash->{'PrintError'} = $CHARP::DB_PRINT_ERROR;
	# Add required attributes that are db-dependant:
	db_connect_attrs_add ($attr_hash);

	DBI->trace ($CHARP::DB_TRACE, $CHARP::DB_TRACE_FNAME);

	my $dbh = DBI->connect_cached ("dbi:$CHARP::DB_DRIVER:$CHARP::DB_STR" . db_dsn_add (), 
								   $CHARP::DB_USER, $CHARP::DB_PASS, $attr_hash);
	undef $CHARP::DB_STR;
	undef $CHARP::DB_USER;
	undef $CHARP::DB_PASS;
	undef $CHARP::DB_DRIVER;

	if (!defined $dbh) {
		my $msg = $DBI::errstr;
		$msg =~ s/\n.*//mg; # Remove sensitive information.
		dispatch_error ({'key' => 'DBI:CONNECT', 'msg' => $msg });
		exit 128;
	}

	$dbh->do ("SET application_name='charp'");

	my $ctx = CHARP::init ($dbh);
	return $ctx;
}

sub disconnect {
	my $ctx = shift;

	$ctx->{'dbh'}->disconnect ();
}

1;
