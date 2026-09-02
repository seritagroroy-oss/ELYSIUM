<?php
session_start();
require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/core/functions.php';

try {
    $sqlite = getDb();
    
    $companyKey = $_SESSION['company_id'] ?? 'comp_default_1';
    $serviceKey = $_SESSION['service_id'] ?? null;
    
    // Le mois qu'on veut regénérer
    $period = $_SESSION['current_period'] ?? '2026-08'; 
    if (isset($_GET['period'])) {
        $period = $_GET['period'];
    }

    // On recalcule la paie AVEC LES NOUVELLES RÈGLES
    $salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, $serviceKey);
    
    // On met à jour UNIQUEMENT LA PHOTO FIGÉE (snapshot), on ne touche pas au statut de publication !
    savePayrollSnapshot($sqlite, $companyKey, $period, $salaries, $serviceKey);
    
    echo "<h2 style='color: green; font-family: sans-serif; padding: 20px;'>Mise à jour réussie !</h2>";
    echo "<p style='font-family: sans-serif; padding: 0 20px;'>L'état de paie de la période <b>$period</b> a été recalculé et mis à jour avec les 30 jours, SANS dépublier le pointage.</p>";
    echo "<p style='font-family: sans-serif; padding: 0 20px;'>Veuillez rafraîchir votre application pour voir les changements.</p>";

} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage();
}
