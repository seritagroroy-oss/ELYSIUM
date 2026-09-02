<?php
try {
    $sqlite = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8mb4', 'root', '');
    $stmt = $sqlite->prepare("SELECT profile_data FROM agents WHERE name = 'SALI NO' LIMIT 1");
    $stmt->execute();
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    file_put_contents('c:/laragon/www/pontage/sali_no_data.txt', print_r(json_decode($res['profile_data'], true), true));
} catch(Exception $e) {
    file_put_contents('c:/laragon/www/pontage/sali_no_data.txt', $e->getMessage());
}
