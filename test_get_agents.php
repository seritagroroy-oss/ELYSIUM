<?php
$_GET['action'] = 'get_all_agents';
session_start();
$_SESSION['user_id'] = 'admin@admin.com';
$_SESSION['user_role'] = 'admin';
$_SESSION['company_id'] = 'comp_f6f0f27d';
$_SESSION['service_id'] = 'svc_1779966235_839';

// Prevent exit in api.php if possible, or just let it exit.
require_once 'api.php';
