<?php
$c = file_get_contents('api.php');
// Strip the auth checks lines 19 to 53
$c = preg_replace('/if \(!isset\(\$_SESSION\[\'user_id\'\]\)\)(.*?)\$sqlite = getDb\(\);/s', '$sqlite = getDb();', $c);
$c = preg_replace('/if \(!\$sub\[\'access_allowed\'\]\)(.*?)break;(.*?)}/s', '', $c);
file_put_contents('api_test.php', $c);
