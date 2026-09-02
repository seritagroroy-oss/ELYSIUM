<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/elysium.db');
$stmt = $sqlite->prepare("SELECT id, name FROM subsites WHERE site_id = 'site_itc'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
