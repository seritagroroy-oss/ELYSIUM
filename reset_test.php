<?php
require 'db.php';

$sqlite = getDb();
// Clear all published_periods
$stmt = $sqlite->prepare("DELETE FROM service_data WHERE key_name = 'published_periods'");
$stmt->execute();
echo "published_periods cleared.\n";

// Clear all archives (since we are in test mode and want to reset the archives and payroll)
$stmt = $sqlite->prepare("DELETE FROM archives");
$stmt->execute();
echo "Archives cleared.\n";
