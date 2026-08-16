<?php
try {
    $pdo = new PDO('sqlite:elysium.db', null, null, [
        PDO::SQLITE_ATTR_OPEN_FLAGS => PDO::SQLITE_OPEN_READONLY
    ]);
    
    $stmt = $pdo->prepare("SELECT name FROM sites WHERE id = 'site_itc'");
    $stmt->execute();
    var_dump($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
