<?php
require "backend/database.php";
$sqlite = getDb();
$stmt = $sqlite->query("SELECT company_id, period FROM archives WHERE id = 'payroll_2026-08'");
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($res, JSON_PRETTY_PRINT);
?>
