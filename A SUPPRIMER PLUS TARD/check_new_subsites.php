<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT * FROM subsites WHERE site_id = '1786991749_896'");
$subsites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "SUBSITES OF NEW SITE:\n";
print_r($subsites);
?>
