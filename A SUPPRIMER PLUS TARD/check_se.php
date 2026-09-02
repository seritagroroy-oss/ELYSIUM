<?php
require 'backend/database.php';
$db = getDb();
foreach ($db->query("SELECT * FROM supplementaires_externes WHERE agent_id = '6a7fa22c4a460' AND periode = '2048-06'") as $row) {
    print_r($row);
}
