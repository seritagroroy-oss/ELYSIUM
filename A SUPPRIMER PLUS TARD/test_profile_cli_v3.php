<?php
try {
    $sqlite = new PDO('sqlite:c:/laragon/www/pontage/backend/pontage.sqlite');
    $stmt = $sqlite->prepare("SELECT site, subsite, profile_data FROM agents WHERE name = 'SALI NO'");
    $stmt->execute();
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents('c:/laragon/www/pontage/sali_no_data.txt', print_r($res, true));
} catch(Exception $e) {
    file_put_contents('c:/laragon/www/pontage/sali_no_data.txt', $e->getMessage());
}
