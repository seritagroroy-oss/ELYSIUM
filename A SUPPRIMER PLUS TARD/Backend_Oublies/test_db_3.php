<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $stmt3 = $db->query("SELECT id, name, status FROM agents WHERE status LIKE 'Suppl|%' OR status LIKE 'Ext_%' LIMIT 5");
    echo "AGENTS STATUS:\n";
    print_r($stmt3->fetchAll());

    $stmt4 = $db->query("SELECT id, agent_id, date, status FROM attendance WHERE status LIKE 'Suppl|%' LIMIT 5");
    echo "ATTENDANCE STATUS:\n";
    print_r($stmt4->fetchAll());
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
