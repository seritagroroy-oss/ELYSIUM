<?php
$sqlite = new PDO('sqlite:c:/laragon/www/pontage/backend/pontage.sqlite');
$stmt = $sqlite->prepare("SELECT site, subsite, profile_data FROM agents WHERE name = 'SALI NO'");
$stmt->execute();
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($res, JSON_PRETTY_PRINT);
