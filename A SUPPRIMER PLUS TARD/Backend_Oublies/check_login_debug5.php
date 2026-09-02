<?php
try {
    $dbPath = __DIR__ . '/elysium.db';
    $conn = new PDO('sqlite:' . $dbPath);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

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
            if ($password === $user['password']) {
                echo "Password matches plain text.\n";
            }
            if (md5($password) === $user['password']) {
                echo "Password matches md5.\n";
            }
        }
    } else {
        echo "User not found.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
