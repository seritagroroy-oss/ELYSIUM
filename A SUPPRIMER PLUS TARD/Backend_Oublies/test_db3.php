<?php
$db = new PDO('sqlite:database.db');
$stmt = $db->query("SELECT a.status, ag.name, a.agent_id FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE a.status LIKE 'REL%'");
if ($stmt) {
    foreach ($stmt as $row) {
        echo $row['name'] . " -> " . $row['status'] . "\n";
    }
} else {
    print_r($db->errorInfo());
}
