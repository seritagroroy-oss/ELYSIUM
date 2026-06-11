<?php
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_GET['action'] = 'register';
$test_data = json_encode([
    'service_name' => 'Test Service',
    'email' => 'test'.time().'@example.com',
    'name' => 'Test User',
    'password' => 'password123'
]);

// Since we cannot mock php://input easily without stream wrapper, we just patch api.php in memory or edit it slightly.
// But we can actually just call the code inside register.
