<?php
require __DIR__ . "/backend/database.php";
$data = ['action' => 'get_blackbox_logs', 'period' => '2026-09'];
$_SESSION['company_id'] = 'comp_bb90668e';
$_SESSION['service_id'] = 'svc_45a046d6';
ob_start();
include __DIR__ . "/backend/modules/sites_v2.php";
$out = ob_get_clean();
echo $out;
