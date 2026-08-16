<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT * FROM calendar_progress WHERE email = 'pcsecuritex@gmail.com'");
echo "Contenu de calendar_progress:\n";
foreach($res as $r) {
    echo "Période: {$r['period']} -> " . substr($r['data'], 0, 100) . "...\n";
}
