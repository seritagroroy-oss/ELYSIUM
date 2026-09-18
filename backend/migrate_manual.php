<?php
require __DIR__ . '/database.php';
$db = getDb();
try {
    $db->exec("CREATE TABLE IF NOT EXISTS pointage_delegations (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        company_id      VARCHAR(100) NOT NULL,
        period          VARCHAR(20)  NOT NULL,
        site_id         VARCHAR(100) NOT NULL,
        site_name       VARCHAR(255) NOT NULL,
        delegated_by    VARCHAR(255) NOT NULL,
        delegated_to    VARCHAR(255) NOT NULL,
        delegated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        status          VARCHAR(20) DEFAULT 'active',
        notes           TEXT
    )");
    echo "pointage_delegations created\n";
} catch (Exception $e) {
    echo "Error pointage_delegations: " . $e->getMessage() . "\n";
}

try {
    $db->exec("CREATE TABLE IF NOT EXISTS system_notifications (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        user_email      VARCHAR(255) NOT NULL,
        company_id      VARCHAR(100) NOT NULL,
        title           VARCHAR(255) NOT NULL,
        message         TEXT NOT NULL,
        type            VARCHAR(50) DEFAULT 'info',
        is_read         TINYINT(1) DEFAULT 0,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        action_url      TEXT,
        action_text     VARCHAR(100)
    )");
    echo "system_notifications created\n";
} catch (Exception $e) {
    echo "Error system_notifications: " . $e->getMessage() . "\n";
}
echo "Migration complete!";
