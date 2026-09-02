<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<pre>";
echo "Testing get_user_info:\n";

// Mocking GET request for get_user_info
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'get_user_info';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

// We just require api_new.php. It will output JSON or a PHP Error.
require 'api_new.php';

echo "\n\nEnd of test.\n";
