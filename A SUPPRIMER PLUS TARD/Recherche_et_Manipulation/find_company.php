<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Search for the company email in services table
$stmt = $sqlite->prepare("SELECT * FROM services WHERE email = ?");
$stmt->execute(['pcsecuritex@gmail.com']);
$service = $stmt->fetch();

if ($service) {
    echo "Found service! Company ID: " . $service['company_id'] . "\n";
    echo "Email: " . $service['email'] . "\n";
} else {
    echo "Service with email pcsecuritex@gmail.com not found.\n";
    // Check users table or other tables
    $tables = ['users', 'companies', 'company'];
    foreach ($tables as $t) {
        try {
            $check = $sqlite->query("SELECT * FROM $t WHERE email = 'pcsecuritex@gmail.com'");
            if ($check) {
                foreach ($check as $r) {
                    echo "Found in $t: " . json_encode($r) . "\n";
                }
            }
        } catch (Exception $e) {}
    }
}
