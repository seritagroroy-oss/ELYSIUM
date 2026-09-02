<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/elysium.db');
$stmt = $sqlite->prepare("SELECT id, name, subsite_id FROM agents WHERE id = '6a4759a99adf7'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
