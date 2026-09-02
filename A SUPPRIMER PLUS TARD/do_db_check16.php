<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$users = $sqlite->query("SELECT id, name, email, role, service, service_id, company_id FROM users WHERE company_id = 'comp_cf66d02f'");

echo json_encode(['users' => $users], JSON_PRETTY_PRINT);
?>
