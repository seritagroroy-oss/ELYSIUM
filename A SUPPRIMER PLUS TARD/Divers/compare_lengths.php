<?php
require_once 'backend/database.php';

$_SESSION['company_id'] = 'comp_cf66d02f';
$company_id = 'comp_cf66d02f';
$_GET['action'] = 'get_pointage_for_archive';
$_GET['period'] = '2026-07';
$action = 'get_pointage_for_archive';

if (!function_exists('resolveCurrentCompanyIdSql')) {
    function resolveCurrentCompanyIdSql() { return "company_id = 'comp_cf66d02f'"; }
}
if (!function_exists('resolveCurrentServiceKeySql')) {
    function resolveCurrentServiceKeySql() { return ""; }
}

ob_start();
require 'backend/modules/pointage.php';
$output = ob_get_clean();

$data = json_decode($output, true);
$json_data = json_encode($data, JSON_UNESCAPED_UNICODE);
echo "GENERATED JSON LENGTH: " . strlen($json_data) . "\n";

$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT data FROM archives_pointage WHERE id = 106");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "DB JSON LENGTH: " . strlen($row['data']) . "\n";
