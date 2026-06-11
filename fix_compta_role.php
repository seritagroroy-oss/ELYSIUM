<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query("SELECT email, role FROM users WHERE email='comptabilite-securitex@gmail.com'");
print_r($res);
$db->exec("UPDATE users SET role = 'admin' WHERE email = 'comptabilite-securitex@gmail.com'");
echo "Role updated to admin.\n";
