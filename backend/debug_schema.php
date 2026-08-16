<?php
require_once __DIR__ . '/database.php';

$sqlite = getDb();

echo "ATTENDANCE SCHEMA:\n";
$stmt = $sqlite->query("DESCRIBE attendance");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\nAGENTS SCHEMA:\n";
$stmt = $sqlite->query("DESCRIBE agents");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
