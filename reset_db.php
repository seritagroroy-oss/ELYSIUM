<?php
require 'backend/database.php';
$sqlite = getDb();
$sqlite->exec("DELETE FROM service_data WHERE data_key = 'published_periods'");
$sqlite->exec("DELETE FROM archives");
echo "Reset OK.";
