<?php
$c = file_get_contents('api.php');
// Restore session_start() - it was commented out by test_disable_session.php
$c = str_replace('//session_start();', 'session_start();', $c);
file_put_contents('api.php', $c);
echo "session_start() restored!\n";
