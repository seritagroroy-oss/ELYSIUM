<?php
require_once 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name FROM sites WHERE company_id = 'comp_cf66d02f' AND archived_period IS NULL AND name LIKE '%EXTRA SUR SITE%'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
