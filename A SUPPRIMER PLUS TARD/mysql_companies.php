<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    echo "=== SERVICES ===\n";
    $rows = $pdo->query("SELECT id, name, company_id FROM services ORDER BY company_id")->fetchAll();
    foreach ($rows as $r) {
        echo "  SvcID:{$r['id']} | Name:{$r['name']} | CompID:{$r['company_id']}\n";
    }
    
    echo "\n=== USERS (admin only) ===\n";
    $rows2 = $pdo->query("SELECT email, role, service_id, company_id, service FROM users WHERE role='admin' ORDER BY company_id")->fetchAll();
    foreach ($rows2 as $r) {
        echo "  Email:{$r['email']} | Role:{$r['role']} | Svc:{$r['service']} | SvcID:{$r['service_id']} | CompID:{$r['company_id']}\n";
    }
    
    echo "\n=== SITES for comp_cf66d02f ===\n";
    $rows3 = $pdo->query("SELECT id, name FROM sites WHERE company_id='comp_cf66d02f'")->fetchAll();
    foreach ($rows3 as $r) echo "  {$r['id']} | {$r['name']}\n";

    echo "\n=== SITES for comp_bb90668e (first 10) ===\n";
    $rows4 = $pdo->query("SELECT id, name FROM sites WHERE company_id='comp_bb90668e' LIMIT 10")->fetchAll();
    foreach ($rows4 as $r) echo "  {$r['id']} | {$r['name']}\n";
    
    echo "\n=== ATTENDANCE for comp_cf66d02f, period 2026-07 (count) ===\n";
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM attendance a JOIN agents ag ON a.agent_id=ag.id JOIN subsites ss ON ag.subsite_id=ss.id JOIN sites s ON ss.site_id=s.id WHERE s.company_id=? AND a.period=?");
    $stmt->execute(['comp_cf66d02f', '2026-07']);
    $row = $stmt->fetch();
    echo "  Count: " . $row['cnt'] . "\n";

    echo "\n=== ATTENDANCE for comp_bb90668e, period 2026-07 (count) ===\n";
    $stmt2 = $pdo->prepare("SELECT COUNT(*) as cnt FROM attendance a JOIN agents ag ON a.agent_id=ag.id JOIN subsites ss ON ag.subsite_id=ss.id JOIN sites s ON ss.site_id=s.id WHERE s.company_id=? AND a.period=?");
    $stmt2->execute(['comp_bb90668e', '2026-07']);
    $row2 = $stmt2->fetch();
    echo "  Count: " . $row2['cnt'] . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
