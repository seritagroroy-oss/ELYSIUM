<?php
require __DIR__ . "/backend/database.php";
$db = getDb();

$sql = "CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(255),
    period VARCHAR(10) NOT NULL,
    action_date DATETIME NOT NULL,
    user VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    details TEXT,
    INDEX (company_id, period),
    INDEX (action_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

try {
    $db->exec($sql);
    echo "Table activity_logs created successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
