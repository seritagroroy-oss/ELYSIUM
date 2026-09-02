<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$tables_with_subsite = [];
foreach ($tables as $table) {
    $cols = $db->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('subsite_id', $cols)) {
        $tables_with_subsite[] = $table;
    }
}
print_r($tables_with_subsite);
?>
