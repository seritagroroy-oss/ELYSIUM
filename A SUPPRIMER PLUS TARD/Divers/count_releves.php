<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("
    SELECT COUNT(a.id) as agent_count 
    FROM agents a
    JOIN subsites s ON a.subsite_id = s.id
    WHERE s.site_id = 'site_releves'
");
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Agents in subsites of site_releves: " . $result['agent_count'] . "\n";
?>
