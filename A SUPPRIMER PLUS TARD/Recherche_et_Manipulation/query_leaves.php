<?php
$db = new PDO('sqlite:c:/laragon/www/pontage/elysium.db');
$stmt = $db->query('SELECT * FROM pointage_leaves');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
