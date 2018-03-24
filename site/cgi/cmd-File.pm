package Cmd::File;

use POSIX qw(:sys_wait_h);

require 'CHARP-cmd.pm';

sub CopyToUsb {
	my ($cmd, $num_parms, $parms, $fcgi) = @_;

	if ($num_parms != 1) {
        return { 'key' => 'CGI:CMDNUMPARAM', 'parms' => [ $cmd, 1, $num_parms ] };
	}

	my @args = ('sudo', '/home/avanty/bin/usb-cp.sh', $parms->[0]);
	if (system (@args) == 0) {
		return undef;
	}
	my $status = $?;

	my $code = $status;
	$code = 'EXIT_' . WEXITSTATUS ($status) if WIFEXITED ($status);
	$code = 'SIGNAL_' . WTERMSIG ($status) if WIFSIGNALED ($status);
	$code = 'STOPPED_' . WSTOPSIG ($status) if WIFSTOPPED ($status);

	return CHARP::cmderr ($cmd, 'Fallo en la copia, archivo: `' . $parms->[0] . '`, status: ' . $code, [$code]);
}

1;
