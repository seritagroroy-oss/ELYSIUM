<?php
$db = new PDO('sqlite:database.sqlite');
$stmt = $db->query("PRAGMA table_info(agents)");
file_put_contents('schema.txt', print_r($stmt->fetchAll(PDO::FETCH_ASSOC), true));
echo "OK";
