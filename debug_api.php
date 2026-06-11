<?php
$_GET['action'] = 'get_site_data';
$_GET['site_id'] = 'site_administration';
$_GET['period'] = '2026-06';
$_SERVER['REQUEST_METHOD'] = 'GET';
session_start();
$_SESSION['user_id'] = 'admin'; // bypass
require 'api.php';
