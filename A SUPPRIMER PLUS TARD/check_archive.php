<?php
try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
    $db = new PDO($dsn, "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $db->prepare("SELECT id, company_id, period, archived_date, archived_by, created_at, LENGTH(data) as data_size FROM archives_pointage WHERE period = '2026-08' ORDER BY created_at DESC");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($rows)) {
        echo "<b style='color:red'>❌ AUCUNE archive trouvée pour 2026-08 dans archives_pointage !</b>";
    } else {
        foreach ($rows as $row) {
            echo "<b style='color:green'>✅ Archive trouvée !</b><br/>";
            echo "ID: " . $row['id'] . "<br/>";
            echo "company_id: " . $row['company_id'] . "<br/>";
            echo "Période: " . $row['period'] . "<br/>";
            echo "Archivée le: " . $row['archived_date'] . "<br/>";
            echo "Archivée par: " . $row['archived_by'] . "<br/>";
            echo "Créée le: " . $row['created_at'] . "<br/>";
            echo "Taille data: " . number_format($row['data_size']) . " octets<br/>";
            echo "<hr/>";
        }
    }
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
