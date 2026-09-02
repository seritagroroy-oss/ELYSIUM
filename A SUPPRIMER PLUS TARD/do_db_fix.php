<?php
require __DIR__ . '/backend/database.php';
$db = getDb();
$db->exec("UPDATE reclamations SET type_erreur = 'Abandon de poste(s)' WHERE agent_nom = 'ss' AND (type_erreur IS NULL OR type_erreur = '')");
echo "Updated";
?>
