<?php
require_once 'database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT a.name, att.date, att.status FROM agents a JOIN attendance att ON a.id = att.agent_id WHERE a.name = 'PAPA' AND att.period = '2029-02'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
