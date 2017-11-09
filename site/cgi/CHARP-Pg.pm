# -*- tab-width: 4; -*-
#
# This file is part of the CHARP project.
#
# Copyright © 2011 - 2014
#   Free Software Foundation Europe, e.V.,
#   Talstrasse 110, 40217 Dsseldorf, Germany
#
# Licensed under the EUPL V.1.1. See the file LICENSE.txt for copying conditions.

package CHARP;

use strict;
use DBD::Pg qw(:pg_types);

%CHARP::pg_errcodes = ();
open (my $efd, 'Pg-errcodes.txt') || die "Can't open errcodes.txt file.";
while (my $l = <$efd>) {
	chomp $l;
	$l =~ s/^\s*//;
	next if $l =~ /^#/;
	next if $l =~ /^$/;
	next if $l =~ /^Section/;
	if ($l =~ /(^[0-9A-Z]{5})\s+([EWS])\s+(\w+)\s+(\w+)/) {
		$CHARP::pg_errcodes{$1} = $4;
	}
}

sub db_connect_attrs_add {
	my $attr_hash = shift;
	$attr_hash->{'pg_enable_utf8'} = 1;
	$attr_hash->{'pg_placeholder_nocolons'} = 1;
	$attr_hash->{'pg_prepare_now'} = 1;
}

sub db_dsn_add {
	return '';
}

sub prepare_attrs {
	return { 'pg_server_prepare' => 1 };
}

sub sql_uid_type {
	return SQL_SMALLINT;
}

sub sql_int_type {
	return SQL_INTEGER;
}

sub sql_str_type {
	return SQL_VARCHAR;
}

sub sql_bool_type {
	return SQL_BOOLEAN;
}

sub sql_date_type {
	return SQL_DATE;
}

sub sql_timestamp_type {
	return SQL_TYPE_TIMESTAMP_WITH_TIMEZONE;
}

sub sql_inet_type {
	return { 'pg_type' => PG_INET };
}

sub sql_params_type {
	return { 'pg_type' => PG_JSONB };
}

sub sql_intarr_type {
	return { 'pg_type' => PG_INT4ARRAY };
}

sub sql_strarr_type {
	return { 'pg_type' => PG_VARCHARARRAY };
}

sub sql_boolarr_type {
	return { 'pg_type' => PG_BOOLARRAY };
}

sub db_err {
	my $h = shift;

	return $h->err;
}

sub db_state_num {
	my $sth = shift;
	my $dbh = shift;

	return $sth->state;
}

sub db_state_str {
	my $sth = shift;
	my $dbh = shift;

	return $CHARP::pg_errcodes{$sth->state};
}

sub call_procedure_query {
	my $proc = shift;
	return 'SELECT * FROM ' . $proc;
}

1;
