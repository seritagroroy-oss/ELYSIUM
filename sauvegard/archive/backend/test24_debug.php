<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$rows = $sqlite->query("SELECT * FROM agents WHERE name LIKE '%YEO YANOUC%'");
echo "<pre>"; print_r($rows); echo "</pre>";
