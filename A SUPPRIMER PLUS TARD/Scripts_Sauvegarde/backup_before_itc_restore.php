<?php
/**
 * SAUVEGARDE - Agents ITC avant restauration
 * Sauvegarde les tables agents et attendance pour comp_cf66d02f
 */
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Sauvegarde agents (tous les agents de comp_cf66d02f)
$agents = $sqlite->query("SELECT * FROM agents WHERE company_id = 'comp_cf66d02f'");
$backup = [
    'date' => date('Y-m-d H:i:s'),
    'company_id' => 'comp_cf66d02f',
    'agents' => $agents,
    'agents_count' => count($agents)
];

// Sauvegarde attendance pour 2026-08 (période actuelle)
$attendance = $sqlite->query("
    SELECT att.* FROM attendance att
    JOIN agents a ON att.agent_id = a.id
    WHERE att.period = '2026-08' AND att.company_id = 'comp_cf66d02f'
    LIMIT 10000
");
$backup['attendance_2026_08'] = $attendance;
$backup['attendance_count'] = count($attendance);

$json = json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$path = __DIR__ . '/sauvegard/backup_agents_ITC_' . date('Ymd_His') . '.json';
file_put_contents($path, $json);

echo "✅ Sauvegarde créée : $path\n";
echo "Agents sauvegardés : {$backup['agents_count']}\n";
echo "Pointages 2026-08 sauvegardés : {$backup['attendance_count']}\n";
