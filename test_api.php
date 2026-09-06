<?php
require __DIR__ . '/backend/core/functions.php';
require __DIR__ . '/backend/database.php';
$_SESSION['company_id'] = 'comp_bb90668e';
$_SESSION['service_id'] = 'svc_45a046d6';
$data = ['action' => 'delete_agent', 'agent_id' => 'agent_123', 'name' => 'Agent Test', 'period' => '2026-09'];
$action = 'delete_agent';
ob_start();
try {
    include __DIR__ . '/backend/modules/sites_v2.php';
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage();
}
$out = ob_get_clean();
echo "OUTPUT:\n$out";
