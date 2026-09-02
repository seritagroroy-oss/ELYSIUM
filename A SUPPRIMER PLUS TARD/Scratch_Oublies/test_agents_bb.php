<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
require_once __DIR__ . "/../backend/database.php";
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT COUNT(*) FROM agents WHERE company_id = ?");
$stmt->execute(["comp_bb90668e"]);
echo "Agents in comp_bb90668e: " . $stmt->fetchColumn() . "\n";

