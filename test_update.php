<?php
require_once "backend/database.php";
require_once "backend/core/functions.php";

$db = getDb();
$stmt = $db->query("SELECT id FROM reclamations LIMIT 1");
$rec = $stmt->fetch(PDO::FETCH_ASSOC);

if ($rec) {
    $id = $rec['id'];
    $success = updateReclamationStatus($id, ['statut' => 'Refusé']);
    echo "Update success: " . ($success ? 'true' : 'false') . "\n";
} else {
    echo "No reclamations found\n";
}
?>
