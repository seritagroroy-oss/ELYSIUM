<?php
// Script pour exporter proprement UNIQUEMENT la base de données "elysium"
// Exécuté sur l'ancien ordinateur.

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$dbname = 'elysium';

$export_file = __DIR__ . '/elysium_export_propre.sql';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Fichier de sortie
    $file = fopen($export_file, 'w');
    if (!$file) {
        die("<h1>❌ Erreur</h1><p>Impossible de créer le fichier d'export dans " . __DIR__ . "</p>");
    }
    
    fwrite($file, "-- Exportation propre de la base de données : $dbname\n");
    fwrite($file, "-- Date : " . date('Y-m-d H:i:s') . "\n\n");
    fwrite($file, "CREATE DATABASE IF NOT EXISTS `$dbname` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n");
    fwrite($file, "USE `$dbname`;\n\n");
    
    // Récupérer toutes les tables
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    
    foreach ($tables as $table) {
        // Ignorer les vues ou tables système si jamais il y en a
        
        // 1. Structure de la table
        fwrite($file, "\n-- Structure de la table `$table`\n");
        fwrite($file, "DROP TABLE IF EXISTS `$table`;\n");
        
        $create_stmt = $pdo->query("SHOW CREATE TABLE `$table`");
        $create_row = $create_stmt->fetch(PDO::FETCH_ASSOC);
        fwrite($file, $create_row['Create Table'] . ";\n\n");
        
        // 2. Données de la table
        fwrite($file, "-- Données de la table `$table`\n");
        $data_stmt = $pdo->query("SELECT * FROM `$table`");
        $data_count = $data_stmt->rowCount();
        
        if ($data_count > 0) {
            $cols_count = $data_stmt->columnCount();
            
            while ($row = $data_stmt->fetch(PDO::FETCH_NUM)) {
                $values = [];
                for ($i = 0; $i < $cols_count; $i++) {
                    if (!isset($row[$i])) {
                        $values[] = "NULL";
                    } else {
                        // Échapper les caractères spéciaux
                        $val = str_replace(['\\', "'", "\r", "\n"], ['\\\\', "''", '\r', '\n'], $row[$i]);
                        $values[] = "'" . $val . "'";
                    }
                }
                fwrite($file, "INSERT INTO `$table` VALUES(" . implode(", ", $values) . ");\n");
            }
        }
        fwrite($file, "\n");
    }
    
    fclose($file);
    
    echo "<h1>✅ Exportation Réussie !</h1>";
    echo "<p>La base de données <b>elysium</b> (avec toute sa structure et vos données) a été sauvegardée avec succès.</p>";
    echo "<p>Un fichier nommé <b>elysium_export_propre.sql</b> vient d'être créé dans le dossier de votre projet.</p>";
    echo "<hr>";
    echo "<h3>Quoi faire maintenant ?</h3>";
    echo "<ol>";
    echo "<li>Allez dans le dossier <b>C:\\laragon\\www\\pontage</b>.</li>";
    echo "<li>Prenez le fichier <b>elysium_export_propre.sql</b> et mettez-le sur votre clé USB.</li>";
    echo "<li>Branchez la clé USB sur le NOUVEL ordinateur.</li>";
    echo "<li>Sur le nouvel ordinateur, ouvrez HeidiSQL et faites <b>Fichier > Exécuter un fichier SQL...</b> avec ce fichier !</li>";
    echo "</ol>";
    
} catch (PDOException $e) {
    die("<h1>❌ Erreur fatale : Impossible de se connecter à la base MySQL</h1><p>" . $e->getMessage() . "</p><p>Assurez-vous que Laragon est bien démarré sur cet ancien PC.</p>");
}
?>
