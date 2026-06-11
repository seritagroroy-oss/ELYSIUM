<?php
$db = new SQLite3(__DIR__ . '/backend/elysium.db');
try {
    $db->exec('ALTER TABLE site_contracts ADD COLUMN prime_site INTEGER DEFAULT 0;');
    echo "Added prime_site\n";
} catch (Exception $e) {
    echo "Already exists or error: " . $e->getMessage() . "\n";
}
?>