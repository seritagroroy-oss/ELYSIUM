<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT id, name, company_id, service_id FROM subsites WHERE site_id = '1786995252_554'");
$subs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "SUBSITES FOR ADMINISTRATION VRAI:\n";
print_r($subs);

$stmt = $db->query("SELECT id, name, company_id, service_id FROM sites WHERE id = '1786995252_554'");
$site = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "SITE RECORD:\n";
print_r($site);
?>
