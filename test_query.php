<?php
$db = new PDO('sqlite:database.sqlite');
$stmt = $db->query("SELECT * FROM subsites WHERE id LIKE '%extras%'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
$stmt2 = $db->query("SELECT * FROM sites WHERE id LIKE '%extras%'");
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
