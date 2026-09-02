<?php
$db = new PDO('sqlite:c:/laragon/www/pontage/backend/data/pontage.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Chercher l'archive dont la période est vide ou nulle
$stmt = $db->query("SELECT id FROM archives WHERE period IS NULL OR period = ''");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as $row) {
    $id = $row['id']; // ex: 'payroll_2026-07' ou autre
    // Extraire la période depuis l'ID
    $period = str_replace('payroll_', '', $id);
    
    // Mettre à jour
    $update = $db->prepare("UPDATE archives SET period = ? WHERE id = ?");
    $update->execute([$period, $id]);
    
    echo "Fixed: $id -> $period<br>";
}
echo "Terminé.";
