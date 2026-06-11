<?php
$db = new PDO('sqlite:database.sqlite');
$stmt = $db->query("PRAGMA table_info(agents)");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
