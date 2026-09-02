<?php
require_once __DIR__ . '/backend/database.php';

try {
    $db = getDb();
    
    try {
        $db->exec("ALTER TABLE users ADD COLUMN remember_token TEXT");
        echo "Colonne 'remember_token' ajoutee avec succes.\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "La colonne 'remember_token' existe deja.\n";
        } else {
            echo "Erreur (peut-etre que la colonne existe deja): " . $e->getMessage() . "\n";
        }
    }
} catch (Exception $e) {
    echo "Erreur de connexion a la base: " . $e->getMessage() . "\n";
}
?>
