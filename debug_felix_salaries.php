<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'SECRET_FIX';
$_SESSION = ['company_id' => 'comp_cf66d02f'];

require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/core/functions.php';

$sqlite = getDb();
$salaries = generateSalariesData($sqlite, '2026-08', 'comp_cf66d02f', 'company_id', 'comp_cf66d02f', null);

foreach ($salaries as $sal) {
    if (stripos($sal['name'], 'felix') !== false) {
        print_r($sal);
    }
}
