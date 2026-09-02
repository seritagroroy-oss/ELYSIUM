<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'c:/laragon/www/pontage/backend/database.php';
require_once 'c:/laragon/www/pontage/backend/core/functions.php';

$sqlite = getDb();
try {
    $salaries = generateSalariesData($sqlite, '2036-11', 'comp_default_1', 'company_id', 'comp_default_1', null);
    echo "SUCCESS: " . count($salaries) . " salaries generated.";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
