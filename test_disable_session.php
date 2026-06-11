<?php
$c = file_get_contents('api.php');
$c = str_replace("session_start();", "//session_start();", $c);
file_put_contents('api.php', $c);
