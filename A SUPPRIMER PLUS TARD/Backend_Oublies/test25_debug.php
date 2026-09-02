<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM attendance WHERE agent_id = '6a43e09f282ec' AND period = '2026-08'");
echo "<pre>"; print_r($stmt); echo "</pre>";
