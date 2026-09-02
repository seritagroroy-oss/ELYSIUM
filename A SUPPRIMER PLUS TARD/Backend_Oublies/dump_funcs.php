<?php
require_once __DIR__.'/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM service_data WHERE key LIKE '%functions%'");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
