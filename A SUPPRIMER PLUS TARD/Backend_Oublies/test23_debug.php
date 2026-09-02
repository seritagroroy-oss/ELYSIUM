<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
if (function_exists('opcache_reset')) { opcache_reset(); }
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM agents WHERE name LIKE '%YEO YANOUC%'");
echo "<pre>"; print_r($stmt); echo "</pre>";
