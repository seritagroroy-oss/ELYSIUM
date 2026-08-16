<?php
require_once 'database.php';
$sqlite = getDb();
$period = '2029-02';

$stmt = $sqlite->prepare("SELECT agent_id, date, status FROM attendance WHERE period = ? AND status NOT IN ('1', 'R')");
$stmt->execute([$period]);
$atts = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total strange attendances: " . count($atts) . "\n";
print_r(array_slice($atts, 0, 10));

$stmt2 = $sqlite->prepare("SELECT COUNT(*) FROM archives WHERE period = ?");
$stmt2->execute([$period]);
echo "\nArchives count: " . $stmt2->fetchColumn() . "\n";
