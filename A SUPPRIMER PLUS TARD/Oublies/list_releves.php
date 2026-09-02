<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("
    SELECT a.name, a.archived_period, a.service_id, a.company_id 
    FROM agents a
    JOIN subsites s ON a.subsite_id = s.id
    WHERE s.site_id = 'site_releves'
");
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "All agents in site_releves:\n";
print_r($result);
?>
