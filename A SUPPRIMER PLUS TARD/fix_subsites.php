<?php
require 'backend/database.php';
$sqlite = getDb();
$sqlite->exec("UPDATE subsites SET company_id = '' WHERE company_id IS NULL AND site_id = 'site_itc'");
echo "OK";
