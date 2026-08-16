<?php
require __DIR__ . '/backend/core/functions.php';
require __DIR__ . '/backend/core/auth.php';
$sqlite = new PDO('sqlite:' . __DIR__ . '/backend/data/pointage_v3.sqlite');
$stmt = $sqlite->query("SELECT id, type_erreur, type_erreur_autre, reclamation_categorie, action_demandee FROM reclamations WHERE agent_nom = 'ss'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
