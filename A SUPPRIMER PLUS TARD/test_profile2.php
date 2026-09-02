<?php
$sqlite = new PDO('sqlite:c:/laragon/www/pontage/backend/elysium.db');
$stmt = $sqlite->prepare("SELECT subsite_id, profile_data FROM agents WHERE name = 'SALI NO'");
$stmt->execute();
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($res, JSON_PRETTY_PRINT);
