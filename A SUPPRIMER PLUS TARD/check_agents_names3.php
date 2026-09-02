<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$names = [
    'KEKELY',
    'ELOI',
    'DJAHOUE'
];

echo "Searching for the agents...\n";
foreach ($names as $name) {
    $stmt = $sqlite->prepare("SELECT id, name, company_id, subsite_id, archived_period FROM agents WHERE name LIKE ?");
    $stmt->execute(['%' . $name . '%']);
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($res)) {
        echo "Agent NOT FOUND: $name\n";
    } else {
        foreach ($res as $a) {
            echo "FOUND: {$a['name']} (ID: {$a['id']}) - Company: {$a['company_id']}, Subsite: {$a['subsite_id']}, Archived: {$a['archived_period']}\n";
        }
    }
}
