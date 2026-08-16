<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id = '6a42ac5e2b98f' AND date IN ('2026-07-12', '2026-07-14', '2026-07-16', '2026-07-18', '2026-07-20')");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
