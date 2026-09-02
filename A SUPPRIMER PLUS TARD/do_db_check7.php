<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();

// check if admin_users exists, otherwise check users
$stmt = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table'");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

$usersTable = '';
if (in_array('admin_users', $tables)) $usersTable = 'admin_users';
else if (in_array('users', $tables)) $usersTable = 'users';

if ($usersTable) {
    $stmt = $sqlite->query("SELECT * FROM $usersTable WHERE name LIKE '%KOFFI%' OR role LIKE '%Autre%'");
    $koffis = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Also get accountants
    $stmt = $sqlite->query("SELECT * FROM $usersTable WHERE service LIKE '%compta%'");
    $comptas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['tables' => $tables, 'koffi' => $koffis, 'comptas' => $comptas], JSON_PRETTY_PRINT);
} else {
    echo "No users table found in sqlite";
}
?>
