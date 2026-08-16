<?php
require __DIR__ . '/backend/core/db.php';
$db = getDb();

// check if admin_users exists, otherwise check users
$stmt = $db->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

$usersTable = '';
if (in_array('admin_users', $tables)) $usersTable = 'admin_users';
else if (in_array('users', $tables)) $usersTable = 'users';

if ($usersTable) {
    $stmt = $db->query("SELECT * FROM $usersTable WHERE name LIKE '%KOFFI%' OR role LIKE '%Autre%' OR email LIKE '%koffi%'");
    $koffis = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Also get accountants
    $stmt = $db->query("SELECT * FROM $usersTable WHERE service LIKE '%compta%'");
    $comptas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['tables' => $tables, 'koffi' => $koffis, 'comptas' => $comptas], JSON_PRETTY_PRINT);
} else {
    echo "No users table found";
}
?>
