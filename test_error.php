<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require 'db.php';
$user = getUserByEmail('admin@gmail.com');
var_dump($user);
