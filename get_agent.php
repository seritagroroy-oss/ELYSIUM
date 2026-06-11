<?php
$db = new PDO('sqlite:database.sqlite');
$stmt = $db->query("SELECT id FROM agents LIMIT 1");
print_r($stmt->fetch());
