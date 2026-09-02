<?php
require __DIR__ . '/database.php';
try {
    $sqlite = getDb();
    
    // 1. Trouver les doublons et ne garder que le plus récent (ID le plus élevé)
    $sqlite->exec("
        DELETE t1 FROM salary_grid t1
        INNER JOIN salary_grid t2 
        WHERE t1.id < t2.id 
        AND t1.company_id = t2.company_id 
        AND t1.poste = t2.poste
    ");
    
    // 2. Ajouter la contrainte d'unicité pour que ON DUPLICATE KEY UPDATE fonctionne
    try {
        $sqlite->exec("ALTER TABLE salary_grid ADD UNIQUE KEY unique_company_poste (company_id, poste)");
        echo "Doublons supprimés et contrainte d'unicité ajoutée avec succès !";
    } catch (Exception $e) {
        echo "Les doublons ont été nettoyés (la contrainte existait peut-être déjà ou autre erreur ignorée : " . $e->getMessage() . ").";
    }
    
} catch (Exception $e) {
    echo "ERREUR : " . $e->getMessage();
}
