<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT id, name, company_id, service_id FROM sites WHERE name = 'ITC'");
$sites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "FOUND SITES:\n";
print_r($sites);
?>
