#!C:/opt/perl/perl/bin/perl.exe
# -*- tab-width: 8; -*-
#
# This file is part of the CHARP project.
#
# Copyright © 2011 - 2014
#   Free Software Foundation Europe, e.V.,
#   Talstrasse 110, 40217 Dsseldorf, Germany
#
# Licensed under the EUPL V.1.1. See the file LICENSE.txt for copying conditions.

use strict;
use lib '.';
use CHARP;

sub request_challenge {
    my $fcgi = shift;
    my $ctx = shift;

    if ($fcgi->request_method () ne 'POST') {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:NOTPOST' });
	return;
    }

    my $req_anon = $fcgi->param ('anon');
    my $req_login = $fcgi->param ('login');
    my $req_res = $fcgi->param ('res');
    my $req_params = $fcgi->param ('params');

    $req_params = '[]' if $req_params eq '';

    if (defined $req_anon) {
	$req_login = '!anonymous';
    } 

    my $ip_addr = $fcgi->remote_addr ();

    if ($req_login eq '!anonymous') {
	$req_res = 'anon_' . $req_res;

	my $func_sth = $ctx->{'func_sth'};
	my $rv = CHARP::execute ($func_sth, $req_res);
	if (!defined $rv) {
	    CHARP::error_execute_send ($ctx->{'dbh'}, $fcgi, $func_sth, $req_login, 
				       $ip_addr, $req_res);
	    return CHARP::error_is_fatal ($func_sth);
	}
	my $rh = ${$func_sth->fetchall_arrayref ({})}[0];

	return request_reply_do ($fcgi, $ctx, $req_login, 
				 {'fname' => $req_res, 'fparams' => $rh->{'fparams'}, 'req_params' => $req_params});
    }

    if (!defined $req_res || !defined $req_params || !defined $req_login) {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:REQPARAM' });
	return;
    }
    
    my $chal_sth = $ctx->{'chal_sth'};
    my $rv = CHARP::execute ($chal_sth, $req_login, $ip_addr, $req_res, $req_params);

    if (!defined $rv) {
	CHARP::error_execute_send ($ctx->{'dbh'}, $fcgi, $chal_sth, $req_login, 
				   $ip_addr, $req_res);
	return CHARP::error_is_fatal ($chal_sth);
    }

    my $res = ${$chal_sth->fetchall_arrayref ({})}[0];

    CHARP::json_send ($fcgi, $res);

    return;
}

%::SQL_TYPES = (
    'UID' => CHARP::sql_uid_type,
    'INT' => CHARP::sql_int_type,
    'STR' => CHARP::sql_str_type,
    'BOOL' => CHARP::sql_bool_type,
    'DATE' => CHARP::sql_date_type,
    'INTARR'  => CHARP::sql_intarr_type,
    'STRARR'  => CHARP::sql_strarr_type,
    'BOOLARR' => CHARP::sql_boolarr_type
);

sub request_reply_file {
    my $fcgi = shift;
    my $func_name = shift;
    my $sth = shift;
    my $fd;

    my $res = $sth->fetchrow_hashref ('NAME_lc');
    $sth->fetchrow_hashref ('NAME_lc'); # Avoid 'still Active' warning, exhaust response buffer.

    if (! exists $res->{'filename'}) {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:FILESEND', 'msg' => sprintf ($CHARP::STRS{'CGI:FILESEND:MISSING:MSG'}, $func_name) });
	return;
    }
    if (! exists $res->{'mimetype'}) {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:FILESEND', 'msg' => sprintf ($CHARP::STRS{'CGI:FILESEND:MISSING:MSG'}, $func_name) });
	return;
    }

    if (! -e $res->{'filename'}) {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:FILESEND', 'msg' => sprintf ($CHARP::STRS{'CGI:FILESEND:NOTFOUND:MSG'}, $func_name, $res->{'filename'}) });
	return;
    }

    if (! sysopen ($fd, $res->{'filename'}, 0)) {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:FILESEND', 'msg' => sprintf ($CHARP::STRS{'CGI:FILESEND:OPENFAIL:MSG'}, $func_name, $res->{'filename'}, $!) });
	return;
    }

    my @stat = stat ($fd);

    print $fcgi->header (-type => $res->{'mimetype'},
			 -Content_Length => $stat[7]);
    
    my $buf;
    while (sysread ($fd, $buf, 4000)) {
	print $buf;
    }

    close ($fd);

    return;
}

sub request_reply {
    my $fcgi = shift;
    my $ctx = shift;

    my $req_login = $fcgi->param ('login');
    my $req_chal = $fcgi->param ('chal');
    my $req_hash = $fcgi->param ('hash');

    if (!defined $req_login || !defined $req_chal || !defined $req_hash) {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:REQPARAM' });
	return;
    }

    my $ip_addr = $fcgi->remote_addr ();
    my $chk_sth = $ctx->{'chk_sth'};
    my $rv = CHARP::execute ($chk_sth, $req_login, $ip_addr, $req_chal, $req_hash);

    if (!defined $rv) {
	my $err = CHARP::error_get ($chk_sth);
	my $request_id;
	$request_id = $err->{'parms'}->[3] if $err->{'type'} eq 'REPFAIL';
	CHARP::error_execute_send ($ctx->{'dbh'}, $fcgi, $chk_sth, $req_login, 
				   $ip_addr, 'REQUEST_CHECK', $request_id, $err);
	return CHARP::error_is_fatal ($chk_sth);
    }

    my $req = ${$chk_sth->fetchall_arrayref ({})}[0];
    
    return request_reply_do ($fcgi, $ctx, $req_login, $req);
}

sub request_reply_do {
    my $fcgi = shift;
    my $ctx = shift;
    
    my $req_login = shift;
    my $req = shift;

    my $func_name = $req->{'fname'};
    my $func_params = $req->{'fparams'};
    my $req_params = $req->{'req_params'};
    my $req_user_id = $req->{'user_id'};
    my $req_request_id = $req->{'request_id'};

    my $ip_addr = $fcgi->remote_addr ();

    my @func_params_arr = split (',', substr ($func_params, 1, -1));
    my $num_fparams = scalar (@func_params_arr);

    my $req_params_arr = eval { CHARP::json_decode ($req_params); };
    if ($@ ne '') {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:BADPARAM', 'msg' => $@, 'parms' => [ $func_name, $req_params ]});
	return;
    }

    my $placeholders = '?,' x $num_fparams;
    chop $placeholders;

    $num_fparams-- if $func_params_arr[0] eq 'UID';
    if (scalar (@$req_params_arr) != $num_fparams) {
	CHARP::error_send ($fcgi, { 'err' => 'CGI:NUMPARAM', 'parms' => [ $func_name, $num_fparams, scalar (@$req_params_arr) ]});
	return;
    }

    my $sth = $ctx->{'dbh'}->prepare_cached (CHARP::call_procedure_query ("rp.$func_name ($placeholders)"), 
					     CHARP::prepare_attrs ());
    if (!defined $sth) {
	CHARP::dispatch_error ({ 'err' => 'ERROR_DBI:PREPARE', 'msg' => $DBI::errstr });
	return;
    }

    my $i = 1;
    my $count = 0;
    foreach my $type (@func_params_arr) {
	my $val;
	if ($type eq 'UID') {
	    $val = $req_user_id;
	} else {
	    last if scalar (@$req_params_arr) == 0;
	    $val = shift (@$req_params_arr);
	    $val = undef if $val eq '';
	    if ($type eq 'BOOLARR' && ref $val eq 'ARRAY') {
		my @arr = map { ($_)? 1: 0 } @$val;
		$val = \@arr;
	    }
	    $count ++;
	}

	eval { $sth->bind_param ($i, $val, $::SQL_TYPES{$type}); };
	if ($@ ne '') {
	    CHARP::error_send ($fcgi, { 'err' => 'CGI:BINDPARAM', 
					'msg' => $@, 
					'parms' => [ $func_name, $count, $val, $req_params ]});
	    return;
	}
	$i++;
    }

    my $info_error;
    $CHARP::INFO_HANDLER = sub {
	my $raise = shift;
	$info_error = CHARP::info_handler ($fcgi, $raise);
    };

    my $rv = CHARP::execute ($sth);

    $CHARP::INFO_HANDLER = undef;
    if ($info_error) {
	CHARP::error_send ($fcgi, $info_error);
	return;
    }
    
    if (!defined $rv) {
	CHARP::error_execute_send ($ctx->{'dbh'}, $fcgi, $sth, $req_login, 
				   $ip_addr, $func_name, $req_request_id);
	return CHARP::error_is_fatal ($sth);
    }

    # Log that the execution of the RP was successful:
    CHARP::error_log ($req_request_id, $CHARP::ERRORS{'SQL:SUCCESS'}, 
		      $req_login, $ip_addr, $func_name, 'success');

    if ($func_name =~ /^file_/ || $func_name =~ /^anon_file_/) {
	return request_reply_file ($fcgi, $func_name, $sth);
    }

    my @fields;
    my $names = $sth->{NAME_lc};
    my $types = $sth->{TYPE};
    for (my $i = 0; $i < scalar (@$names); $i++) {
	my $type = $ctx->{'dbh'}->type_info ($types->[$i]);
	push @fields, "{\"name\":\"$names->[$i]\",\"type\":\"$type->{TYPE_NAME}\"}";
    }

    CHARP::json_print_headers ($fcgi);

    print '{"fields":[' . 
	join (',', @fields) .
	'],"data":' .
	CHARP::json_encode ($sth->fetchall_arrayref ()) .
	'}';

    $sth->finish ();

    return;
}

# Request dispatcher. If it returns any value but undefined, dispatching loop ends.
sub request_main {
    my $fcgi = shift;
    my $ctx = shift;

    if ($fcgi->url('-absolute' => 1) eq '/request') {
	return request_challenge ($fcgi, $ctx);
    }

    if ($fcgi->url('-absolute' => 1) eq '/reply') {
	return request_reply ($fcgi, $ctx);
    }

    CHARP::error_send ($fcgi, { 'err' => 'CGI:PATHUNK' });
    return;
}

sub main {
    my $dbh = CHARP::connect ();
    exit 128 if !defined $dbh;

    my $ctx = CHARP::init ($dbh);

    # Wait for requests, call dispatcher callback and loop.
    CHARP::dispatch (\&request_main, $ctx);
    $dbh->disconnect ();
}

main ();
