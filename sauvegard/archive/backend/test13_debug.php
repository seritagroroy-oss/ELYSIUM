<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$_REQUEST['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX';
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();

$rows2 = $sqlite->query("SELECT DISTINCT period FROM attendance WHERE agent_id IN (SELECT id FROM agents WHERE name LIKE '%YEO%') ORDER BY period DESC");
foreach ($rows2 as $r) {
    echo "Found period for YEO: " . $r['period'] . "<br>";
}

$rows3 = $sqlite->query("SELECT name, id FROM agents WHERE name LIKE '%YEO%'");
foreach ($rows3 as $r) {
    echo "Found agent: " . $r['name'] . " (ID: " . $r['id'] . ")<br>";
}
