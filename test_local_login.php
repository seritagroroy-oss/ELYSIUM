<?php
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$data = ['email' => 'admin@gmail.com', 'password' => 'admin123'];
require_once 'api.php';
// We should just call it directly, but api.php does exit; so we can just run api.php?action=login via curl.
