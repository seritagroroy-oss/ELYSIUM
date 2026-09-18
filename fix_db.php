<?php
require_once "backend/database.php";
$db = getDb();
$stmt = $db->query("UPDATE reclamations SET statut = 'Refusé' WHERE statut = 'Transmis' AND statut_final = 'Refusée'");
echo "Nombre de lignes corrigées : " . $stmt->rowCount() . "\n";
?>
