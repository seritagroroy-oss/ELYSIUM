<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$sub_ids = ['itc_tenue_compbb90668e', 'itc_costume_compbb90668e', 'itc_ots_compbb90668e', 'itc_as_compbb90668e'];
$placeholders = implode(',', array_fill(0, count($sub_ids), '?'));
$stmtA = $sqlite->prepare("SELECT COUNT(*) FROM agents WHERE subsite_id IN ($placeholders) AND (exit_date IS NULL OR exit_date = '')");
$stmtA->execute($sub_ids);
echo "Count compbb90668e: " . $stmtA->fetchColumn() . "\n";

$sub_ids2 = ['itc_tenue_compf168e8d9', 'itc_costume_compf168e8d9', 'itc_ots_compf168e8d9', 'itc_special_compf168e8d9'];
$placeholders2 = implode(',', array_fill(0, count($sub_ids2), '?'));
$stmtA2 = $sqlite->prepare("SELECT COUNT(*) FROM agents WHERE subsite_id IN ($placeholders2) AND (exit_date IS NULL OR exit_date = '')");
$stmtA2->execute($sub_ids2);
echo "Count compf168e8d9: " . $stmtA2->fetchColumn() . "\n";
