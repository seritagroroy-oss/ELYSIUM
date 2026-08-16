<?php
/**
 * Script de migration de SQLite vers MySQL.
 * Ce script lit les données de elysium.db et les insère dans une base de données MySQL.
 * AUCUNE donnée SQLite n'est supprimée ou modifiée.
 */

// Configuration MySQL (à modifier selon votre environnement local)
$mysql_host = '127.0.0.1';
$mysql_port = '3306';
$mysql_dbname = 'elysium'; // Assurez-vous que cette base existe dans phpMyAdmin
$mysql_user = 'root';
$mysql_pass = ''; // Vide par défaut sur XAMPP/Laragon

// Configuration SQLite (la base se trouve dans le dossier backend)
$sqlite_path = __DIR__ . '/backend/elysium.db';

if (!file_exists($sqlite_path)) {
    die("ERREUR: Impossible de trouver la base d'origine $sqlite_path\n");
}

header('Content-Type: text/plain; charset=utf-8');

echo "========================================\n";
echo "  MIGRATION SQLITE -> MYSQL DÉMARRÉE  \n";
echo "========================================\n\n";

if (!file_exists($sqlite_path)) {
    die("ERREUR : Fichier SQLite introuvable ($sqlite_path)\n");
}

try {
    // 1. Connexion SQLite (avec SQLite3 natif car la base a été créée avec)
    $sqlite = new SQLite3($sqlite_path);
    $sqlite->enableExceptions(true);
    echo "✅ Connecté à SQLite (elysium.db)\n";

    // 2. Création automatique de la base MySQL (si elle n'existe pas)
    $mysql_initial = new PDO("mysql:host=$mysql_host;port=$mysql_port;charset=utf8mb4", $mysql_user, $mysql_pass);
    $mysql_initial->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $mysql_initial->exec("CREATE DATABASE IF NOT EXISTS `$mysql_dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Base de données MySQL ('$mysql_dbname') vérifiée/créée\n";

    // 3. Connexion à la base spécifique
    $mysql_dsn = "mysql:host=$mysql_host;port=$mysql_port;dbname=$mysql_dbname;charset=utf8mb4";
    $mysql = new PDO($mysql_dsn, $mysql_user, $mysql_pass);
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $mysql->exec('SET FOREIGN_KEY_CHECKS=0');
    echo "✅ Connecté à MySQL\n\n";

} catch (PDOException $e) {
    die("ERREUR DE CONNEXION : " . $e->getMessage() . "\nAssurez-vous que le serveur MySQL est démarré et que la base '$mysql_dbname' existe.\n");
}

// 3. Récupération des tables SQLite
$stmt = $sqlite->query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
$tables = [];
while ($row = $stmt->fetchArray(SQLITE3_ASSOC)) {
    $tables[] = $row;
}

echo "📦 " . count($tables) . " tables trouvées dans SQLite.\n\n";

foreach ($tables as $table) {
    $tableName = $table['name'];
    echo "--- Traitement de la table : $tableName ---\n";

    // 4. Création de la table MySQL
    // Conversion basique du schéma SQLite vers MySQL
    $schema = $table['sql'];
    // On remplace les types spécifiques SQLite par des équivalents MySQL
    $schema = str_ireplace('AUTOINCREMENT', 'AUTO_INCREMENT', $schema);
    
    // On supprime les guillemets SQLite si présents
    $schema = str_replace('"', '`', $schema);
    
    // Exécuter la création de table
    try {
        $mysql->exec("DROP TABLE IF EXISTS `$tableName`");
        
        // Plutôt que de parser le SQL de SQLite (ce qui est très fragile), on va recréer la table 
        // en lisant la structure des colonnes de la table SQLite.
        $colStmt = $sqlite->query("PRAGMA table_info(`$tableName`)");
        $columnsInfo = [];
        while ($colRow = $colStmt->fetchArray(SQLITE3_ASSOC)) {
            $columnsInfo[] = $colRow;
        }
        
        $mysqlCols = [];
        $primaryKeys = [];
        
        foreach ($columnsInfo as $col) {
            $colName = $col['name'];
            $colType = strtoupper($col['type']);
            
            // Mapping de types simples
            if (strpos($colType, 'INT') !== false) {
                $myType = 'INT';
            } elseif (strpos($colType, 'REAL') !== false || strpos($colType, 'FLOA') !== false || strpos($colType, 'DOUB') !== false) {
                $myType = 'DOUBLE';
            } elseif (strpos($colType, 'BLOB') !== false) {
                $myType = 'LONGBLOB';
            } else {
                $myType = 'LONGTEXT'; // Par défaut, on utilise du TEXT pour la flexibilité (TEXT/VARCHAR dans SQLite)
            }
            
            // Auto increment handling in SQLite is usually INTEGER PRIMARY KEY
            if ($col['pk'] > 0) {
                $primaryKeys[] = "`$colName`";
                if ($myType === 'INT' && stripos($table['sql'], 'AUTOINCREMENT') !== false) {
                    $myType .= ' AUTO_INCREMENT';
                } elseif ($myType === 'LONGTEXT') {
                    // MySQL n'accepte pas TEXT/LONGTEXT en PRIMARY KEY sans longueur
                    // Dans ELYSIUM, les IDs textuels sont des UUIDs
                    $myType = 'VARCHAR(255)';
                }
            }
            
            $mysqlCols[] = "`$colName` $myType";
        }
        
        if (!empty($primaryKeys)) {
            $mysqlCols[] = "PRIMARY KEY (" . implode(', ', $primaryKeys) . ")";
        }
        
        $mysql->exec("DROP TABLE IF EXISTS `$tableName`");
        $createSql = "CREATE TABLE `$tableName` (" . implode(', ', $mysqlCols) . ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        $mysql->exec($createSql);
        echo "   [Créée] Structure adaptée.\n";
        
    } catch (PDOException $e) {
        echo "   ❌ ERREUR Création : " . $e->getMessage() . "\n";
        continue;
    }

    // 5. Copie des données par lots (batch)
    try {
        $countStmt = $sqlite->query("SELECT COUNT(*) as count FROM `$tableName`");
        $totalRows = $countStmt->fetchArray(SQLITE3_ASSOC)['count'];
        
        if ($totalRows == 0) {
            echo "   [Vide] 0 lignes à copier.\n";
            continue;
        }

        $batchSize = 1000;
        $copiedRows = 0;
        
        // Préparer la requête d'insertion MySQL
        $cols = array_map(function($c) { return $c['name']; }, $columnsInfo);
        $placeholders = implode(',', array_fill(0, count($cols), '?'));
        $colNames = implode(',', array_map(function($c) { return "`$c`"; }, $cols));
        
        $insertStmt = $mysql->prepare("INSERT INTO `$tableName` ($colNames) VALUES ($placeholders)");
        
        // Lire et insérer
        $offset = 0;
        while ($offset < $totalRows) {
            $selectStmt = $sqlite->query("SELECT * FROM `$tableName` LIMIT $batchSize OFFSET $offset");
            $rows = [];
            while ($r = $selectStmt->fetchArray(SQLITE3_ASSOC)) {
                $rows[] = $r;
            }
            
            $mysql->beginTransaction();
            foreach ($rows as $row) {
                $values = [];
                foreach ($cols as $col) {
                    $values[] = $row[$col];
                }
                $insertStmt->execute($values);
                $copiedRows++;
            }
            $mysql->commit();
            $offset += $batchSize;
        }
        
        echo "   [Succès] $copiedRows / $totalRows lignes copiées.\n";

    } catch (Exception $e) {
        if ($mysql->inTransaction()) {
            $mysql->rollBack();
        }
        echo "   ❌ ERREUR Copie : " . $e->getMessage() . "\n";
    }
}

// Réactiver les clés étrangères
$mysql->exec('SET FOREIGN_KEY_CHECKS=1');

echo "\n========================================\n";
echo "  MIGRATION TERMINÉE !\n";
echo "========================================\n";
echo "Prochaine étape : \n";
echo "1. Vérifiez vos données dans phpMyAdmin.\n";
echo "2. Modifiez votre fichier .env pour utiliser MySQL (DB_CONNECTION=mysql).\n";
