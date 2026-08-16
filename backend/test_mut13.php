<?php
require 'database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT s.name as site_name, s.id as site_id, sub.id as subsite_id FROM sites s JOIN subsites sub ON sub.site_id = s.id WHERE sub.id = '1783251655_675_1'");
$stmt->execute();
print_r($stmt->fetch(PDO::FETCH_ASSOC));
