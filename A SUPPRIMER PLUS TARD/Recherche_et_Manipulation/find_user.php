<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

try {
    $stmt = $sqlite->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute(['pcsecuritex@gmail.com']);
    $user = $stmt->fetch();
    if ($user) {
        echo "Found in users: " . json_encode($user) . "\n";
        echo "Company ID: " . $user['company_id'] . "\n";
    } else {
        echo "Not found in users.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
