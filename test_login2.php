<?php
$_GET['action'] = 'login';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
// Cannot easily mock php://input here, let's mock the parsed variable instead in api.php if we could.
// Or we can mock the $data array by requiring api.php after overriding file_get_contents. 
// But a simpler way is just to test `register.php` logic.
