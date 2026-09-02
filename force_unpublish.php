<?php
session_start();
require_once __DIR__ . '/backend/core/functions.php';

try {
    $sqlite = getDb();
    
    // Si l'utilisateur n'a pas de session, on force comp_default_1
    $companyKey = $_SESSION['company_id'] ?? 'comp_default_1';
    
    // On efface la liste des périodes publiées
    setServiceDataSql($companyKey, 'published_periods', []);
    
    // On supprime les photos figées des salaires
    $sqlite->exec("DELETE FROM period_salaries");
    
    // On met à jour les statuts de paie
    $sqlite->exec("DELETE FROM payroll_statuses");
    
    echo "<h2 style='color: green; font-family: sans-serif; padding: 20px;'>Succès !</h2>";
    echo "<p style='font-family: sans-serif; padding: 0 20px;'>Toutes les périodes ont été dépubliées (déverrouillées).<br><br>Veuillez fermer cet onglet et rafraîchir l'application (F5). La paie sera recalculée avec les 30 jours.</p>";
} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage();
}
