<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require "backend/database.php";
$db = getDb();
$stmt = $db->query("SELECT id, statut, statut_final FROM reclamations");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($data);
?>
