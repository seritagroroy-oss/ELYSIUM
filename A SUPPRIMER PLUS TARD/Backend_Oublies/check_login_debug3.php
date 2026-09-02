<?php
try {
    $dbPath = __DIR__ . '/pontage.sqlite';
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
            // Check if password might be stored in plain text?
            if ($password === $user['password']) {
                echo "Wait, password matches as plain text!\n";
            }
            // Check md5?
            if (md5($password) === $user['password']) {
                echo "Wait, password matches as md5!\n";
            }
        }
    } else {
        echo "User not found.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
