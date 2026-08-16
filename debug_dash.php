<?php
if (function_exists('opcache_reset')) { opcache_reset(); }
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['service_id'] = 'COMPLET';
$_SESSION['role'] = 'admin';
$_SESSION['company_id'] = 'comp_default_1';
$_GET['action'] = 'get_dashboard_init';
$_GET['period'] = '2026-08';
$_GET['site_id'] = 'site_extras_sur_site';
echo "RUNNING MOCK\n";

if (function_exists('opcache_reset')) { opcache_reset(); }

require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT agent_id, status FROM attendance WHERE period = '2026-07' AND status LIKE '%EXTRA SUR%'");
$stmt->execute();
$rows = $stmt->fetchAll();
echo json_encode($rows);
