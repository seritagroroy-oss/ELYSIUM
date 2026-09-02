<?php
try {
    $sqlite = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8mb4', 'root', '');
    $stmt = $sqlite->prepare("SELECT name, company_id, exit_date FROM agents WHERE name LIKE '%SALI NO%'");
    $stmt->execute();
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents('c:/laragon/www/pontage/sali_no_data.txt', print_r($res, true));
} catch(Exception $e) {
    file_put_contents('c:/laragon/www/pontage/sali_no_data.txt', $e->getMessage());
}
