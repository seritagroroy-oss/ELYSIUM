<?php
$env = file_get_contents('c:/laragon/www/pontage/backend/.env');
preg_match('/DB_DATABASE=(.*)/', $env, $db_name);
preg_match('/DB_USERNAME=(.*)/', $env, $user);
preg_match('/DB_PASSWORD=(.*)/', $env, $pass);

$pdo = new PDO('mysql:host=127.0.0.1;dbname='.trim($db_name[1]), trim($user[1]), trim($pass[1]));

$stmt = $pdo->prepare("SELECT id, name, profile_data FROM agents WHERE name LIKE '%RAPHAEL%'");
$stmt->execute();
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<pre>";
print_r($results);
echo "</pre>";
?>
