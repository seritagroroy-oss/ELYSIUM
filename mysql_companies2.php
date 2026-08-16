<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    echo "=== SERVICES ===\n";
    $rows = $pdo->query("SELECT id, name, company_id FROM services ORDER BY company_id")->fetchAll();
    foreach ($rows as $r) {
        echo "  " . $r['id'] . " | " . $r['name'] . " | " . $r['company_id'] . "\n";
    }
    
    echo "\n=== ADMIN USERS ===\n";
    $rows2 = $pdo->query("SELECT email, role, service_id, company_id, service FROM users WHERE role='admin' ORDER BY company_id")->fetchAll();
    foreach ($rows2 as $r) {
        echo "  " . $r['email'] . " | " . $r['service'] . " | " . $r['company_id'] . "\n";
    }
    
    echo "\n=== SITES for comp_cf66d02f ===\n";
    $rows3 = $pdo->query("SELECT id, name FROM sites WHERE company_id='comp_cf66d02f'")->fetchAll();
    foreach ($rows3 as $r) echo "  " . $r['id'] . " | " . $r['name'] . "\n";

    echo "\n=== SITES for comp_bb90668e (first 5) ===\n";
    $rows4 = $pdo->query("SELECT id, name FROM sites WHERE company_id='comp_bb90668e' LIMIT 5")->fetchAll();
    foreach ($rows4 as $r) echo "  " . $r['id'] . " | " . $r['name'] . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
