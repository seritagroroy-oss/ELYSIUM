<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
header('Content-Type: text/plain');

echo "=== service_data ===\n";
try {
    $stmt = $pdo->query('DESCRIBE service_data');
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) echo $c['Field'] . ' | ' . $c['Type'] . ' | Key=' . $c['Key'] . "\n";
} catch(Exception $e) {
    echo "NOT FOUND: " . $e->getMessage() . "\n";
}

echo "\n=== payroll_snapshots ===\n";
try {
    $stmt = $pdo->query('DESCRIBE payroll_snapshots');
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) echo $c['Field'] . ' | ' . $c['Type'] . ' | Key=' . $c['Key'] . "\n";
} catch(Exception $e) {
    echo "NOT FOUND: " . $e->getMessage() . "\n";
}

echo "\n=== published_periods data ===\n";
try {
    $stmt = $pdo->query("SELECT service_id, data_key, LEFT(data_value, 300) as val FROM service_data WHERE data_key = 'published_periods' LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo $r['service_id'] . ' | ' . $r['data_key'] . ' | ' . $r['val'] . "\n";
    }
    if (empty($rows)) echo "(No rows)\n";
} catch(Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== latest_publication data ===\n";
try {
    $stmt = $pdo->query("SELECT service_id, data_key, LEFT(data_value, 300) as val FROM service_data WHERE data_key = 'latest_publication' LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo $r['service_id'] . ' | ' . $r['data_key'] . ' | ' . $r['val'] . "\n";
    }
    if (empty($rows)) echo "(No rows)\n";
} catch(Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== ALL companies in services table ===\n";
try {
    $stmt = $pdo->query("SELECT DISTINCT company_id, id, name FROM services ORDER BY company_id LIMIT 20");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo $r['company_id'] . ' | ' . $r['id'] . ' | ' . $r['name'] . "\n";
    }
} catch(Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== Payroll snapshots ===\n";
try {
    $stmt = $pdo->query("SELECT company_id, period, published_by, published_at FROM payroll_snapshots ORDER BY published_at DESC LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo $r['company_id'] . ' | ' . $r['period'] . ' | ' . $r['published_by'] . ' | ' . $r['published_at'] . "\n";
    }
    if (empty($rows)) echo "(No snapshots)\n";
} catch(Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== ElysiumPdoDb class check ===\n";
echo "Checking if getDb() returns MySQL...\n";
