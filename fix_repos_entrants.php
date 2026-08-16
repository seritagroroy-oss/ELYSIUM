<?php
require_once __DIR__ . '/backend/database.php';

$db = getDb();

try {
    // Nettoyage des jours "Repos" (ou autres) assignés par erreur AVANT la date d'embauche
    $queryAvant = "
        DELETE a 
        FROM attendance a 
        JOIN agents b ON a.agent_id = b.id 
        WHERE a.status = 'R' 
        AND b.hire_date IS NOT NULL 
        AND b.hire_date != '' 
        AND a.date < b.hire_date
    ";
    
    $stmtAvant = $db->prepare($queryAvant);
    $stmtAvant->execute();
    $countAvant = $stmtAvant->rowCount();

    // Nettoyage des jours "Repos" assignés par erreur APRÈS la date de départ (si applicable)
    $queryApres = "
        DELETE a 
        FROM attendance a 
        JOIN agents b ON a.agent_id = b.id 
        WHERE a.status = 'R' 
        AND b.exit_date IS NOT NULL 
        AND b.exit_date != '' 
        AND a.date > b.exit_date
    ";
    
    $stmtApres = $db->prepare($queryApres);
    $stmtApres->execute();
    $countApres = $stmtApres->rowCount();

    echo "<div style='font-family: sans-serif; padding: 20px; color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; max-width: 600px; margin: 40px auto;'>";
    echo "<h2 style='margin-top: 0;'>Nettoyage terminé avec succès ✅</h2>";
    echo "<p>Le système a corrigé les attributions de repos erronées.</p>";
    echo "<ul>";
    echo "<li><strong>" . $countAvant . "</strong> pointages 'Repos' supprimés car situés AVANT la date d'embauche (Entrants).</li>";
    echo "<li><strong>" . $countApres . "</strong> pointages 'Repos' supprimés car situés APRÈS la date de départ (Sortants).</li>";
    echo "</ul>";
    echo "<p style='margin-bottom: 0;'><a href='/' style='color: #155724; font-weight: bold;'>Retourner à l'application</a></p>";
    echo "</div>";

} catch (PDOException $e) {
    echo "<div style='font-family: sans-serif; padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; max-width: 600px; margin: 40px auto;'>";
    echo "<h2 style='margin-top: 0;'>Erreur lors du nettoyage ❌</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    
    // Si c'est SQLite et que la syntaxe JOIN avec DELETE ne fonctionne pas
    if (strpos($e->getMessage(), 'syntax') !== false) {
        try {
            // Fallback pour SQLite
            $db->exec("
                DELETE FROM attendance 
                WHERE status = 'R' 
                AND EXISTS (
                    SELECT 1 FROM agents 
                    WHERE agents.id = attendance.agent_id 
                    AND agents.hire_date IS NOT NULL 
                    AND agents.hire_date != '' 
                    AND attendance.date < agents.hire_date
                )
            ");
            
            $db->exec("
                DELETE FROM attendance 
                WHERE status = 'R' 
                AND EXISTS (
                    SELECT 1 FROM agents 
                    WHERE agents.id = attendance.agent_id 
                    AND agents.exit_date IS NOT NULL 
                    AND agents.exit_date != '' 
                    AND attendance.date > agents.exit_date
                )
            ");
            echo "<p><strong>Note :</strong> Une méthode de secours (SQLite) a été utilisée avec succès. Rechargez la page de paie.</p>";
            echo "<p style='margin-bottom: 0;'><a href='/' style='color: #721c24; font-weight: bold;'>Retourner à l'application</a></p>";
        } catch (Exception $e2) {
             echo "<p>Échec du plan de secours : " . htmlspecialchars($e2->getMessage()) . "</p>";
        }
    }
    
    echo "</div>";
}
