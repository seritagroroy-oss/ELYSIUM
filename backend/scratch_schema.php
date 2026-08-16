<?php
$db = new PDO('sqlite:' . __DIR__ . '/elysium.db');
$stmt = $db->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='archives_pointage'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
