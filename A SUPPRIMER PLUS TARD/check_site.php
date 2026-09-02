<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$stmt = $db->query("SELECT id, name FROM sites WHERE name LIKE '%EXTRAS BUREAUX V%'");
$sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "FOUND SITES:\n";
print_r($sites);
?>
