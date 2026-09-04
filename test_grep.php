<?php
require 'backend/config/database.php';
$stmt = $pdo->prepare("SELECT * FROM attendance WHERE agent_id = 'ag_1786546162_ag_eloi_6a671947c91da' AND date = '2026-07-21'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
