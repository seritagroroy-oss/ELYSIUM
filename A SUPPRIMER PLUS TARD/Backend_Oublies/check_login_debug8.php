<?php
try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
    $conn = new PDO($dsn, "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $email = 'pcsecuritex@gmail.com';
    $stmt = $conn->prepare("SELECT id, email, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "User found: " . $user['email'] . "\n";
        
        $password = 'pentagone0172494913';
        if (password_verify($password, $user['password'])) {
            echo "Password matches!\n";
        } else {
            echo "Password does NOT match.\n";
            // Create a new hash to see what it should be
            echo "New hash for password: " . password_hash($password, PASSWORD_DEFAULT) . "\n";
        }
    } else {
        echo "User not found.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
