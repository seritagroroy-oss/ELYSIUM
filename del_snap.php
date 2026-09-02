<?php
session_start();
$_SESSION['user_id'] = 1;
require 'backend/database.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$companyKey = 'comp_cf66d02f';
$period = '2026-08';

$stmt = $sqlite->prepare("SELECT COUNT(*) as cnt FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$companyKey, $period]);
$row = $stmt->fetch();
echo "Snapshots avant: " . $row['cnt'] . "<br/>\n";

$del = $sqlite->prepare("DELETE FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$del->execute([$companyKey, $period]);
echo "Lignes supprimees: " . $del->rowCount() . "<br/>\n";

$stmt2 = $sqlite->prepare("SELECT COUNT(*) as cnt FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt2->execute([$companyKey, $period]);
$row2 = $stmt2->fetch();
echo "Snapshots apres: " . $row2['cnt'] . "<br/>\n";
echo "Termine ! Rafraichissez la page de paie.<br/>\n";
?>
