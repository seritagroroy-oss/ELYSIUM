<?php
require_once __DIR__ . '/backend/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT id, name, company_id, service_id FROM sites");
$stmt->execute();
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
