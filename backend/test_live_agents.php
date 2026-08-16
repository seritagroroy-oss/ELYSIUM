<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    
    // Check July 2026 LIVE mutated agents
    $stmt = $db->query("
        SELECT DISTINCT a.agent_id, ag.name 
        FROM attendance a
        JOIN agents ag ON a.agent_id = ag.id
        WHERE a.period = '2026-07'
        AND (a.status LIKE 'M|🌟 EXTRA SUR SITE' 
             OR a.status LIKE 'EXT%|🌟 EXTRA SUR SITE' 
             OR a.status LIKE 'REL%|🌟 EXTRA SUR SITE' 
             OR a.status = 'Suppl|site_extras_sur_site')
    ");
    $mutated = $stmt->fetchAll();
    
    echo "LIVE MUTATED AGENTS IN JULY 2026:\n";
    print_r($mutated);

    $stmt2 = $db->query("SELECT DISTINCT agent_id FROM attendance WHERE period = '2026-07' AND (status LIKE '%site_extras_sur_site%' OR status LIKE '%EXTRA SUR SITE%')");
    echo "\nALL AGENTS MENTIONING EXTRA SUR SITE IN ATTENDANCE STATUS IN JULY 2026:\n";
    print_r($stmt2->fetchAll());

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
