<?php
require_once 'database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT a.subsite_id, a.id as agent_id, a.name FROM agents a JOIN attendance att ON a.id = att.agent_id WHERE att.period = '2029-02' AND att.status = 'A' LIMIT 1");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row) {
    echo "Found agent: {$row['name']} (ID: {$row['agent_id']})\n";
    echo "Subsite ID: {$row['subsite_id']}\n";
    $stmt2 = $sqlite->prepare("SELECT site_id FROM subsites WHERE id = ?");
    $stmt2->execute([$row['subsite_id']]);
    $site_id = $stmt2->fetchColumn();
    echo "This belongs to site_id: $site_id\n";
    
    // Now fetch attendance for this agent
    $stmt3 = $sqlite->prepare("SELECT date, status FROM attendance WHERE agent_id = ? AND period = '2029-02'");
    $stmt3->execute([$row['agent_id']]);
    print_r($stmt3->fetchAll(PDO::FETCH_ASSOC));
} else {
    echo "No agent found with A";
}
