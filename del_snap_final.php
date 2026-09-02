<?php
session_start();
$_SESSION['user_id'] = 1;
require 'backend/database.php';

$sqlite = getDb();
$companyKey = 'comp_cf66d02f';
$period = '2026-08';

// Supprimer TOUS les snapshots pour cette entreprise/période
$del = $sqlite->prepare("DELETE FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$del->execute([$companyKey, $period]);
$deleted = $del->rowCount();

echo "Snapshots supprimés: $deleted<br/>\n";

// Vérification finale
$chk = $sqlite->prepare("SELECT * FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$chk->execute([$companyKey, $period]);
$rows = $chk->fetchAll();
echo "Snapshots restants: " . count($rows) . "<br/>\n";
echo "Terminé. Rafraîchissez maintenant l'État de Paie (F5).<br/>\n";
?>
