<?php
require_once 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name, site_id FROM subsites WHERE id IN ('sub_1783016633_4535', 'sub_1782484131_4585')");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
