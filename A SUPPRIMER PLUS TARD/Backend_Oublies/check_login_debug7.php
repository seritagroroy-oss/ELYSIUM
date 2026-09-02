<?php
try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
    $conn = new PDO($dsn, "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $email = 'pcsecuritex@gmail.com';
    // Let's also check all columns or tables if the user doesn't exist
    $stmt = $conn->prepare("SELECT * FROM admin_users WHERE email = ?"); // Usually admins are in admin_users, let's see. Or 'users'
    
    // First let's check what tables exist
    $tablesStmt = $conn->query("SHOW TABLES");
    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . "\n\n";

    // Let's assume the table is 'users' or 'admin_users' or something
    $tableToQuery = in_array('users', $tables) ? 'users' : (in_array('admin_users', $tables) ? 'admin_users' : '');

    if ($tableToQuery) {
        $stmt = $conn->prepare("SELECT * FROM $tableToQuery WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo "User found in $tableToQuery:\n";
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
            echo "User not found in $tableToQuery with email $email.\n";
            
            // Let's fetch all emails in $tableToQuery
            $stmt = $conn->query("SELECT email FROM $tableToQuery");
            $allEmails = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo "All emails in $tableToQuery: " . implode(', ', $allEmails) . "\n";
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
