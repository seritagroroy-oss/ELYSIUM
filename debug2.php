<?php
session_start();
require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/auth.php';

$sqlite = getDb();
$site_id = 'site_extras'; // or 'site_itc' or whatever. We can fetch from $_SESSION if we don't know
$serviceKey = '';
$company_id = 'comp_default_1';
$period = '2026-07';

$stmt = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND (service_id = ? OR service_id IS NULL)");
$stmt->execute([$site_id, $serviceKey]);
$subsites_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

file_put_contents('debug_out.txt', print_r($subsites_rows, true));
echo "OK";
?>
