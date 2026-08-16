<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT * FROM users WHERE email = 'pcsecuritex@gmail.com'");
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Users with email pcsecuritex@gmail.com:\n";
foreach ($users as $u) {
    echo "ID: {$u['id']}, Name: {$u['name']}, Company: {$u['company_id']}\n";
}
