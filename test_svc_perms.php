<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT permissions FROM services WHERE id = ?");
$stmt->execute(['svc_45a046d6']);
print_r($stmt->fetch(PDO::FETCH_ASSOC));
