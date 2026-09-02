<?php
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name, company_id FROM subsites WHERE name LIKE '%6ème SENS%' OR name LIKE '%EXTRAS BUREAUX ABIDJAN%' OR name LIKE '%ABIDJAN MALL%'");
$stmt->execute([]);
$subsites = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "SUBSITES:\n";
print_r($subsites);
