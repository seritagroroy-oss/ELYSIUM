<?php
$db_path = 'c:/laragon/www/pontage/backend/database/database.sqlite';
$sqlite = new PDO('sqlite:' . $db_path);
$stmt = $sqlite->query("SELECT id, period, archived_date FROM archives_pointage");
$archives = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Archives Pointage :\n";
print_r($archives);
