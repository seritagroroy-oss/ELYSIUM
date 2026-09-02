<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("
    SELECT subsite_id, COUNT(id) as count 
    FROM agents 
    WHERE subsite_id = 'site_admin_1' OR subsite_id LIKE 'site_admin%'
    GROUP BY subsite_id
");
$stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($stats);
?>
