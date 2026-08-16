<?php
require __DIR__ . '/database.php';
try {
    $sqlite = getDb();
    
    // 1. Delete duplicates first
    $sqlite->exec("
        DELETE t1 FROM salary_grid t1
        INNER JOIN salary_grid t2 
        WHERE t1.id < t2.id 
        AND t1.company_id = t2.company_id 
        AND t1.poste = t2.poste
    ");
    
    // 2. Change column types to VARCHAR(255) so they can be indexed
    $sqlite->exec("ALTER TABLE salary_grid MODIFY company_id VARCHAR(255)");
    $sqlite->exec("ALTER TABLE salary_grid MODIFY poste VARCHAR(255)");
    
    // 3. Add UNIQUE KEY
    try {
        $sqlite->exec("ALTER TABLE salary_grid ADD UNIQUE KEY unique_company_poste (company_id, poste)");
        echo "Succès : Doublons supprimés, types corrigés, et contrainte d'unicité ajoutée !";
    } catch (Exception $e) {
        echo "Contrainte déjà existante ou erreur ignorée : " . $e->getMessage();
    }
    
} catch (Exception $e) {
    echo "ERREUR : " . $e->getMessage();
}
