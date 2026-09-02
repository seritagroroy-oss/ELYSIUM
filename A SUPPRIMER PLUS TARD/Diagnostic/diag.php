<?php
require 'api_new.php';

$db = getDb();
// Obtenir un vrai site_id
$stmt = $db->query("SELECT id FROM sites LIMIT 1");
$site_id = $stmt->fetchColumn();

// On simule ce que fait pointage.php
$serviceKey = 'svc_45a046d6'; // Depuis le dump json précédent
$stmt = $db->prepare("SELECT * FROM subsites WHERE site_id = ? AND (service_id = ? OR service_id IS NULL OR service_id = '')");
$stmt->execute([$site_id, $serviceKey]);
$subsites_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmtAgents = $db->prepare("SELECT * FROM agents WHERE site_id = ? AND (service_id = ? OR service_id IS NULL OR service_id = '')");
$stmtAgents->execute([$site_id, $serviceKey]);
$agents = $stmtAgents->fetchAll(PDO::FETCH_ASSOC);

echo "<h3>Diagnostic</h3>";
echo "<b>Site ID testé :</b> $site_id<br>";
echo "<b>Zones trouvées :</b> " . count($subsites_rows) . "<br>";
echo "<b>Agents trouvés :</b> " . count($agents) . "<br><hr>";

echo "<pre>Zones:\n";
print_r($subsites_rows);
echo "\n\nAgents:\n";
print_r($agents);
echo "</pre>";
