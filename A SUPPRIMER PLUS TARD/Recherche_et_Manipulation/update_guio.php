<?php
require_once __DIR__ . '/backend/database.php';
$db = getDb();

echo "<pre>";
echo "=== MISE A JOUR DE LA FONCTION DE GUIO LANDRY (MC -> AS) ===\n";

$stmt = $db->prepare("UPDATE agents SET `function` = 'AS' WHERE id = '6a452af23c04f'");
$stmt->execute();
$count = $stmt->rowCount();

echo "Nombre de lignes modifiees : " . $count . "\n\n";

$stmt2 = $db->prepare("
    SELECT a.id, a.name, a.function, a.subsite_id, sub.name as subsite_name, s.name as site_name
    FROM agents a
    LEFT JOIN subsites sub ON a.subsite_id = sub.id
    LEFT JOIN sites s ON sub.site_id = s.id
    WHERE a.id = '6a452af23c04f'
");
$stmt2->execute();
$agent = $stmt2->fetch();

print_r($agent);
echo "</pre>";
