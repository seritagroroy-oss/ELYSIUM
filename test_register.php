<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'register';
$data = ['service_name'=>'Test Service', 'email'=>'testuser@gmail.com', 'name'=>'Test User', 'password'=>'test1234'];
// Overwrite file_get_contents behavior or just patch it?
// Actually api.php does:
// $data = json_decode(file_get_contents('php://input'), true);
// $data = is_array($data) ? $data : [];
// We can't easily mock it without rewriting api.php. Let's create a temporary file and mock php://input if possible? No.
// Let's just edit test_register.php to use POST instead of JSON if it supports it, or use curl.
