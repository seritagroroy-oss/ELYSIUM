<?php
require 'backend/database.php';
$db = getDb();
$rows = $db->query("SELECT date, shift_code, status FROM attendance WHERE agent_id = '6a7fa22c4a460' AND period = '2048-06'");

$absence = 0;
foreach($rows as $row) {
    if (in_array($row['status'], ['A', 'MAP', 'AT', 'CP', 'P'])) {
        $absence++;
    }
}
echo "Absences: " . $absence . "\n";
