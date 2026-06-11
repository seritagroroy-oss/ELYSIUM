<?php
require_once 'backend/database.php';
$db = getDb();

$queries = [
    "ALTER TABLE entreprises ADD COLUMN owner_email TEXT;",
    "ALTER TABLE users ADD COLUMN workspace_type TEXT DEFAULT 'AUTRE';",
    "ALTER TABLE users ADD COLUMN phone TEXT;",
    "ALTER TABLE users ADD COLUMN profile_photo TEXT;",
    "ALTER TABLE agents ADD COLUMN has_cnps INTEGER;",
    "ALTER TABLE agents ADD COLUMN bank_account TEXT;",
    "ALTER TABLE agents ADD COLUMN notes TEXT;",
    "ALTER TABLE agents ADD COLUMN shift_history TEXT;"
];

foreach ($queries as $q) {
    try {
        $db->exec($q);
        echo "Success: $q\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'duplicate column name') !== false) {
            echo "Already exists: $q\n";
        } else {
            echo "Error for $q : " . $e->getMessage() . "\n";
        }
    }
}
