<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/../../backend/database.sqlite');
$stmt = $sqlite->query("SELECT * FROM service_data WHERE key LIKE '%functions%'");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
