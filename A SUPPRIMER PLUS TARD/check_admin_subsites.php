<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("
    SELECT id, name, company_id, service_id 
    FROM subsites 
    WHERE site_id = 'site_administration'
");
$subsites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "SUBSITES FOR SITE_ADMINISTRATION:\n";
print_r($subsites);
?>
