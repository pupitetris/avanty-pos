#!C:/opt/perl/perl/bin/perl.exe
use CGI::Fast;
use Cwd;
use lib '.';
$count = 0;
eval { require "request.pl"; };
$err = $@;
while (my $q = CGI::Fast->new) {
  print("Content-Type: text/plain\n\n");
  print("$count " . getcwd . "\n");
  $count ++;
  print "$err\n";
  foreach $var (sort(keys(%ENV))) {
    $val = $ENV{$var};
    $val =~ s|\n|\\n|g;
    $val =~ s|"|\\"|g;
    print "${var}=\"${val}\"\n";
  }
}
