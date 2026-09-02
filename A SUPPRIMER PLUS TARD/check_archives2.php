<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=elysium', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query("SELECT period, company_id, archived_date FROM archives_pointage ORDER BY archived_date DESC LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
