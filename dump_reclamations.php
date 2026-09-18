<?php
require "backend/database.php";
$db = getDb();
$stmt = $db->query("SELECT id, statut, statut_final, motif_refus FROM reclamations");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents("reclamations_dump.txt", print_r($data, true));
?>
