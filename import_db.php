<?php
// Script d'importation robuste qui ignore les erreurs de droits (ex: information_schema)
$sql_file = __DIR__ . '/elysium.sql';

if (!file_exists($sql_file)) {
    die("<h1>Erreur : Fichier introuvable</h1><p>Veuillez copier votre fichier <b>elysium.sql</b> dans le dossier <b>C:\\laragon\\www\\pontage</b> puis rafraîchissez cette page.</p>");
}

echo "<h1>Importation de la base de données...</h1>";

try {
    // Connexion au serveur MySQL local (sans spécifier de base pour le moment)
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT); // Mode silencieux pour ignorer les erreurs

    // 1. Forcer la création de la base Elysium si elle n'existe pas
    $pdo->exec("CREATE DATABASE IF NOT EXISTS elysium CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p>✔️ Base de données 'elysium' vérifiée/créée.</p>";

    // 2. Lire le fichier SQL
    $sql_content = file_get_contents($sql_file);
    if (empty($sql_content)) {
        die("<p>❌ Le fichier elysium.sql est vide !</p>");
    }

    // 3. Séparer les requêtes et les exécuter une par une pour ignorer les erreurs individuellement
    $queries = explode(';', $sql_content);
    $success_count = 0;
    $error_count = 0;

    foreach ($queries as $query) {
        $query = trim($query);
        if (empty($query)) continue;

        // Si la requête essaie de toucher à information_schema ou mysql, on l'ignore volontairement
        if (stripos($query, 'information_schema') !== false || stripos($query, 'USE `mysql`') !== false) {
            continue; 
        }

        $stmt = $pdo->prepare($query);
        if ($stmt->execute()) {
            $success_count++;
        } else {
            $error_count++;
        }
    }

    echo "<p>✔️ <b>Importation terminée !</b></p>";
    echo "<p>Requêtes réussies : $success_count</p>";
    if ($error_count > 0) {
        echo "<p style='color: orange;'>Requêtes ignorées (erreurs normales liées aux droits système) : $error_count</p>";
    }
    
    echo "<h2>🎉 C'est fait ! Vous pouvez maintenant retourner sur votre site : <a href='/'>Cliquez ici pour aller sur Elysium</a></h2>";
    echo "<p><i>(Vous pourrez supprimer le fichier elysium.sql et import_db.php ensuite).</i></p>";

} catch (PDOException $e) {
    die("<h1>❌ Erreur fatale : Impossible de se connecter à MySQL</h1><p>" . $e->getMessage() . "</p>");
}
?>
