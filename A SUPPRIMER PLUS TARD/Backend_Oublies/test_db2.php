<?php
require 'core/functions.php';
$db = getDb();
$stmt = $db->query("SELECT a.status, ag.name, a.agent_id FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE a.status LIKE 'REL%'");
foreach ($stmt as $row) {
    echo $row['name'] . " -> " . $row['status'] . "\n";
}
