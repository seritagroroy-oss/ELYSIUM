<?php
$db = new PDO('sqlite:pontage.sqlite');
try {
    $db->exec('ALTER TABLE users ADD COLUMN photo TEXT DEFAULT NULL');
    echo 'Column added';
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
