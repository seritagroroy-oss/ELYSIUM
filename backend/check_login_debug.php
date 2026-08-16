<?php
require_once __DIR__ . '/database.php';
$db = Database::getInstance();
$conn = $db->getConnection();

$email = 'pcsecuritex@gmail.com';
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo "User found:\n";
    print_r($user);
    
    $password = 'pentagone0172494913';
    if (password_verify($password, $user['password'])) {
        echo "Password matches!\n";
    } else {
        echo "Password does NOT match.\n";
    }
} else {
    echo "User not found.\n";
}
