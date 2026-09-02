<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/core/functions.php';

$sqlite = getDb();
// get functions for comp_f01cbf5b (one of the problematic ones)
$functions = getServiceDataSql('comp_f01cbf5b', 'functions', []);
echo json_encode($functions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
