<?php
$db = new SQLite3(__DIR__ . '/backend/elysium.db');
$res = $db->query("SELECT * FROM salary_grid");
$rows = [];
while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
    $rows[] = $row;
}
echo json_encode($rows, JSON_PRETTY_PRINT);
?>
