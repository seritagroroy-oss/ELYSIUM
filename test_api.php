<?php
session_start();
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SESSION['role'] = 'admin';
$_SESSION['service_id'] = 'some_service_id';
$_POST['data'] = json_encode(['action' => 'rename_site', 'site_id' => 'site1', 'name' => 'New Name']);

require 'api.php';
