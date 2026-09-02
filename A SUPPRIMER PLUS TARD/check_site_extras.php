<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT * FROM sites WHERE id = 'site_extras'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
