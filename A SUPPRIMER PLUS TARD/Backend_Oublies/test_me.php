<?php
require 'database.php';
try {
    $db = getDb();
    echo "DB connected successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
