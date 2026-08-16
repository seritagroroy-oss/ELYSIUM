<?php
require '../core/functions.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT a.*, ag.name as agent_name, ag.service_id as ag_service FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE a.status LIKE 'REL%'");
if ($stmt) {
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach($rows as $r) {
        echo "Agent: " . $r['agent_name'] . " | Date: " . $r['date'] . " | Status: '" . $r['status'] . "' | ServiceID: '" . $r['ag_service'] . "'\n";
    }
} else {
    print_r($sqlite->errorInfo());
}
