<?php
try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
    $conn = new PDO($dsn, "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $email = 'pcsecuritex@gmail.com';
    $stmt = $conn->prepare("SELECT status, maintenance_mode, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "Status: " . ($user['status'] ?? 'null') . "\n";
        echo "Maintenance Mode: " . ($user['maintenance_mode'] ?? 'null') . "\n";
        echo "Role: " . ($user['role'] ?? 'null') . "\n";
    } else {
        echo "User not found.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
