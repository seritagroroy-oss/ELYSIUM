<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$curr = $sqlite->query("SELECT * FROM agents WHERE id = '6a7e10c5cbfed'");
var_dump($curr);
