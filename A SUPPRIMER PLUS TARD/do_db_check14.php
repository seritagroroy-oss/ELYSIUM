<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$users = $sqlite->query("SELECT id, name, role, service, service_id, company_id FROM users WHERE service LIKE '%SECURITEX%' OR name LIKE '%SECURITEX%' OR email LIKE '%securitex%'");

echo json_encode(['users' => $users], JSON_PRETTY_PRINT);
?>
