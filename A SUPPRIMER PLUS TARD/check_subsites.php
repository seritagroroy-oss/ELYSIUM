<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT * FROM subsites WHERE site_id = 'site_releves'");
$subsites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "SUBSITES OF SITE_RELEVES:\n";
print_r($subsites);
?>
