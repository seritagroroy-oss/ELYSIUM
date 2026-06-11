<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
session_start();
$_SESSION['company_id'] = 'comp_default_1';
$_POST['action'] = 'get_site_data';
$_POST['site_id'] = 'site_extras';
$_POST['period'] = '2024-05';
require 'api.php';
