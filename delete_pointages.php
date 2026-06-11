<?php
require 'backend/database.php';
$db = getDb();

// Les pointages des viviers spéciaux sont identifiables par leur status
// Extras: EXT|..., EXT_A|..., EXT_R|...
// Relèves: REL|..., REL_A|..., REL_R|...
// Administration: ADM|..., ADM_A|...

// On supprime aussi les agents dont le subsite_id est 'site_extras_1', 'site_releves_1', 'site_admin_1'
// car ces agents vivent physiquement dans ces viviers spéciaux

// 1) Supprimer les pointages de type EXT|, REL|, ADM|
$stmt = $db->prepare("
    DELETE FROM attendance 
    WHERE status LIKE 'EXT|%' 
       OR status LIKE 'EXT_A|%' 
       OR status LIKE 'EXT_R|%'
       OR status LIKE 'REL|%' 
       OR status LIKE 'REL_A|%' 
       OR status LIKE 'REL_R|%'
       OR status LIKE 'ADM|%'
       OR status LIKE 'ADM_A|%'
");
$stmt->execute([]);
echo "Etape 1 - Pointages EXT/REL/ADM supprimes.\n";

// 2) Supprimer les pointages des agents résidant dans les subsites spéciaux
$stmt2 = $db->prepare("
    DELETE FROM attendance 
    WHERE agent_id IN (
        SELECT id FROM agents WHERE subsite_id IN ('site_extras_1', 'site_releves_1', 'site_admin_1')
    )
");
$stmt2->execute([]);
echo "Etape 2 - Pointages agents speciaux supprimes.\n";

echo "Termine.\n";
