<?php
$json = file_get_contents('c:/laragon/www/pontage/pointage_db.json');
$data = json_decode($json, true);
echo json_encode(array_keys($data), JSON_PRETTY_PRINT);
