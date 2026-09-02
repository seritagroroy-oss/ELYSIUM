<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT * FROM calendar_progress WHERE email = 'pcsecuritex@gmail.com' AND period = '2026-08'");
if (!empty($res)) {
    echo $res[0]['data'];
} else {
    echo "No data for 2026-08";
}
