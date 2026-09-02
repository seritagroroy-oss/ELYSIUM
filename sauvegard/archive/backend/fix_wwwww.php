<?php
$db = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$stmt = $db->prepare("UPDATE attendance SET status = REPLACE(status, 'PM|WWWWW', 'PM|ITC/IFM') WHERE status LIKE 'PM|WWWWW%'");
$stmt->execute();
$countPM = $stmt->rowCount();

$stmt2 = $db->prepare("UPDATE attendance SET status = REPLACE(status, 'M|WWWWW', 'M|ITC/IFM') WHERE status LIKE 'M|WWWWW%'");
$stmt2->execute();
$countM = $stmt2->rowCount();

echo "Mises à jour effectuées : $countPM pour PM|WWWWW, $countM pour M|WWWWW.\n";
