<?php
session_start();
$_SESSION['user_id'] = 1;
require 'backend/database.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$companyKey = 'comp_cf66d02f';
$period = '2026-08';

// Supprimer le snapshot existant
$del = $sqlite->prepare("DELETE FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$del->execute([$companyKey, $period]);
echo "Snapshot supprime: " . $del->rowCount() . " ligne(s)<br/>\n";

// Verifier
$check = $sqlite->prepare("SELECT COUNT(*) as cnt FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$check->execute([$companyKey, $period]);
$row = $check->fetch();
echo "Snapshots restants: " . $row['cnt'] . "<br/>\n";
echo "OK. Rafraichissez maintenant la page de paie.<br/>\n";
?>
