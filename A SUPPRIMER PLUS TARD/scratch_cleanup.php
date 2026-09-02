<?php
require_once __DIR__ . '/backend/modules/api.php';
$db = getDb();
$db->exec("DELETE FROM attendance WHERE status IN ('DELETE_ENTRANT', 'DELETE_SORTANT')");
echo 'Cleanup done. Affected rows: ' . $db->query("SELECT changes()")->fetchColumn();
