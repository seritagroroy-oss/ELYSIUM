<?php
require 'backend/database.php';
$sqlite = getDb();
echo "<pre>";
$stmt_orig = $sqlite->prepare("SELECT s.name, s.id FROM sites s JOIN subsites sub ON sub.site_id = s.id WHERE sub.id = 'site_extras_1'");
$stmt_orig->execute([]);
$orig_site = $stmt_orig->fetch(PDO::FETCH_ASSOC);
print_r($orig_site);
echo "</pre>";
