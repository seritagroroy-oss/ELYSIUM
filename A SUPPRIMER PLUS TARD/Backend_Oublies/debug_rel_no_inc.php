<?php
$dbPath = 'database.sqlite';
if (!file_exists($dbPath)) {
    $dbPath = 'database.db';
}
if (!file_exists($dbPath)) {
    echo "NO DB FOUND!"; exit;
}
$sqlite = new PDO('sqlite:' . $dbPath);
$stmt = $sqlite->query("SELECT a.*, ag.name as agent_name, ag.service_id as ag_service FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE a.status LIKE 'REL%'");
if ($stmt) {
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach($rows as $r) {
        echo "Agent: " . $r['agent_name'] . " | Date: " . $r['date'] . " | Status: '" . $r['status'] . "' | ServiceID: '" . $r['ag_service'] . "'\n";
    }
}
