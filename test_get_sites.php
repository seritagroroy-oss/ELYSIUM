<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
session_start();
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = 'serv_default_1';
$_SESSION['user_id'] = 'test';
$_POST['action'] = 'get_sites';
require 'api.php';
