<?php
require __DIR__ . '/backend/database.php';
$db = getDb();
$stmt = $db->query("SELECT id, type_erreur, type_erreur_autre, reclamation_categorie, action_demandee FROM reclamations WHERE agent_nom = 'ss'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
