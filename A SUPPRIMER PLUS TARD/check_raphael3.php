<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$stmt = $pdo->prepare("SELECT id, name, profile_data FROM agents WHERE name LIKE '%RAPHAEL%'");
$stmt->execute();
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<pre>";
print_r($results);
echo "</pre>";
?>
