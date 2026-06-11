<?php
require 'backend/database.php';
$db = getDb();

// Relancer la mise à jour du service_id pour les 30 pointages restants de KONEZ
$stmt = $db->prepare("
    UPDATE attendance 
    SET service_id = (SELECT a.service_id FROM agents a WHERE a.id = attendance.agent_id),
        company_id = (SELECT a.company_id FROM agents a WHERE a.id = attendance.agent_id)
    WHERE (service_id IS NULL OR service_id = '')
    AND agent_id IN (SELECT id FROM agents WHERE service_id IS NOT NULL AND service_id != '')
");
$stmt->execute([]);

// Vérification finale
$checks = [
    'Pointages sans service_id' => "SELECT COUNT(*) as c FROM attendance WHERE service_id IS NULL OR service_id = ''",
    'Pointages sans company_id' => "SELECT COUNT(*) as c FROM attendance WHERE company_id IS NULL OR company_id = ''",
    'Pointages sans period'     => "SELECT COUNT(*) as c FROM attendance WHERE period IS NULL OR period = ''",
    'Pointages orphelins'       => "SELECT COUNT(*) as c FROM attendance WHERE agent_id NOT IN (SELECT id FROM agents)",
    'Agents sans service_id'    => "SELECT COUNT(*) as c FROM agents WHERE service_id IS NULL OR service_id = ''",
    'Sites sans service_id'     => "SELECT COUNT(*) as c FROM sites WHERE service_id IS NULL OR service_id = ''",
];

$all_ok = true;
foreach ($checks as $label => $sql) {
    $r = $db->query($sql);
    $count = $r[0]['c'] ?? 0;
    $icon = $count === 0 ? '✅' : '❌';
    if ($count > 0) $all_ok = false;
    echo "$icon $label: $count\n";
}

$total = $db->query("SELECT COUNT(*) as c FROM attendance");
echo "\nTotal pointages: " . ($total[0]['c'] ?? 0) . "\n";

if ($all_ok) {
    echo "\n🎉 Base de données 100% cohérente !\n";
} else {
    echo "\n⚠️ Problèmes restants.\n";
}
