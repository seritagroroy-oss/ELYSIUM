<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/data/database.sqlite');
$stmt = $sqlite->query("SELECT id, name FROM subsites WHERE site_id = 'site_itc'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
