<?php
require_once 'database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("
    SELECT COUNT(*) as count
    FROM agents
    WHERE subsite_id LIKE '%site_extras_sur_site%' OR subsite_id LIKE '%EXTRA SUR SITE%'
");
$stmt->execute();
$count = $stmt->fetchColumn();

echo "Total agents NATIVE to EXTRA SUR SITE: " . $count . "\n";
