<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$users = $sqlite->query("SELECT id, email, name, role, service, service_id, company_id FROM users WHERE company_id = 'comp_fb486391'");

echo json_encode(['users' => $users], JSON_PRETTY_PRINT);
?>
