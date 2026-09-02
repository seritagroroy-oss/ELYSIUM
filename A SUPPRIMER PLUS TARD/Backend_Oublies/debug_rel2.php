<?php
$sqlite = new PDO('sqlite:database.sqlite');
$stmt = $sqlite->query("SELECT a.*, ag.name as agent_name, ag.subsite_id, ag.service_id as ag_service FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE a.status LIKE 'REL%'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "ATTENDANCE ROWS:\n";
foreach($rows as $r) {
    echo "Agent: " . $r['agent_name'] . " | Date: " . $r['date'] . " | Status: " . $r['status'] . " | SubsiteID: " . $r['subsite_id'] . "\n";
}
