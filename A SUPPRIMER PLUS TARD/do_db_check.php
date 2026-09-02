<?php
require __DIR__ . '/backend/core/db.php';
$db = getDb();
$stmt = $db->query("SELECT * FROM agents WHERE nom LIKE '%KOFFI JEAN-YVES%' OR nom LIKE '%KOFFI%'");
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $db->query("SELECT * FROM payroll_archives");
$archives = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Agents:\n";
print_r($agents);
echo "\nArchives:\n";
print_r($archives);
?>
