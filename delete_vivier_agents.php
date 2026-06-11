<?php
require 'backend/database.php';
$db = getDb();

// Supprimer d'abord les pointages de ces agents
$stmt = $db->prepare("
    DELETE FROM attendance 
    WHERE agent_id IN (
        SELECT id FROM agents WHERE subsite_id IN ('site_extras_1', 'site_releves_1', 'site_admin_1')
    )
");
$stmt->execute([]);
echo "Pointages supprimés.\n";

// Supprimer les agents
$stmt2 = $db->prepare("
    DELETE FROM agents WHERE subsite_id IN ('site_extras_1', 'site_releves_1', 'site_admin_1')
");
$stmt2->execute([]);
echo "Agents supprimés.\n";

// Vérification
$rows = $db->query("SELECT COUNT(*) as c FROM agents WHERE subsite_id IN ('site_extras_1', 'site_releves_1', 'site_admin_1')");
echo "Agents restants dans viviers spéciaux: " . ($rows[0]['c'] ?? 0) . "\n";
$rows2 = $db->query("SELECT COUNT(*) as c FROM agents");
echo "Total agents restants: " . ($rows2[0]['c'] ?? 0) . "\n";
