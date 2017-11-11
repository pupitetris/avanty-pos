# -*- tab-width: 4; -*-
package CHARP;

# Set limits on the amount of information a message can contain.
$CGI::POST_MAX = 1024 * 1024 * 5;
# This keeps uploaded requests in memory, may not be desirable for big deploys handling lots of file uploads:
$CGI::DISABLE_UPLOADS = 1;
# FIXME: if we enable uploads, we have to use different calls to deal with uploaded files.

$DB_NAME = 'avanty';
$DB_HOST = '127.0.0.1';
$DB_PORT = '5432';
$DB_USER = 'avanty';
$DB_PASS = '123';

# This works with both Pg and mysql:
$DB_STR = "database=$DB_NAME;host=$DB_HOST;port=$DB_PORT";
undef $DB_NAME;
undef $DB_HOST;
undef $DB_PORT;

# Postgres: To set up a service connection file (best practice).
# http://search.cpan.org/dist/DBD-Pg/Pg.pm#connect
# Remove variable declarations above and uncomment:
#
# $ENV{'PGSYSCONFDIR'} = '/var/blahblah/my_pg_service.conf';
# $DB_STR = '';
# $DB_USER = '';
# $DB_PASS = '';

# MySQL: use mysql
$DB_DRIVER = 'Pg';

$DB_TIMEZONE = 'Mexico/General';

# Language for the localized strings.
$CHARP_LANG = 'es';

# DBI tracing:
# http://search.cpan.org/~timb/DBI-1.637/DBI.pm#TRACING

# No tracing (production):
#$DB_TRACE = '0';

# Trace top-level DBI method calls returning with results or errors and SQL statements executed:
$DB_TRACE = '0|SQL';
$DB_TRACE_FNAME = 'c:/opt/Apache24/logs/DBI.log';
#$DB_TRACE_FNAME = *STDERR;

# Send errors to stderr? (Effectively showing on the web server's error.log)
# $DB_PRINT_ERROR = 0; # Production
$DB_PRINT_ERROR = 1;

1;
