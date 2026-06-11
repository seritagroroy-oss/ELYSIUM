<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
session_start();
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = 'serv_default_1';
$_SESSION['user_id'] = 'test';
$_POST['action'] = 'apply_mutation';
// Use the ID from the database
$_POST['agent_id'] = 'ag_some_id'; 
$_POST['start_date'] = '2024-05-15';
$_POST['destination_subsite_id'] = 'site_extras_1';
$_POST['destination_name'] = '🌟 Vivier des Extras';
$_POST['period'] = '2024-05';
require 'api.php';
