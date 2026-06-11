<?php
require 'backend/database.php';
$db = getDb();

$ids = ['1779531032_928', '1779746632_984', '1779746746_147'];

foreach ($ids as $id) {
    // Delete the subsite
    $db->exec("DELETE FROM subsites WHERE id = '$id'");
    
    // Also delete any agents that might have been in these subsites
    $db->exec("DELETE FROM agents WHERE subsite_id = '$id'");
}

echo "Suppression réussie.\n";
