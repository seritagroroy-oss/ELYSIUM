<?php
require __DIR__ . '/core/db.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM supplementaires_externes");
if ($stmt) {
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} else {
    echo "Table does not exist or error: " . print_r($sqlite->errorInfo(), true);
}
