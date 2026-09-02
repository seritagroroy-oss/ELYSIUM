<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT id, name, company_id, service_id FROM sites WHERE id = '1786991749_896'");
$site = $stmt->fetch(PDO::FETCH_ASSOC);

echo "NEW SITE DETAILS:\n";
print_r($site);
?>
