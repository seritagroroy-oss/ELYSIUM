<?php
$db = new PDO('sqlite:c:\laragon\www\pontage\backend\data\database.sqlite');
$stmt = $db->query("SELECT date, shift_code, status FROM attendance WHERE agent_id = (SELECT id FROM agents WHERE name = 'XXXXX') ORDER BY date ASC, shift_code ASC");
foreach($stmt as $row) {
    echo $row['date'] . ' | ' . $row['shift_code'] . ' | ' . $row['status'] . "\n";
}
