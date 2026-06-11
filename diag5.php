<?php
require 'backend/database.php';
$sqlite = getDb();
// Find which user has service_id svc_1779390619_638
$rows = $sqlite->query("SELECT email, name, service_id FROM users WHERE service_id = 'svc_1779390619_638'");
foreach ($rows as $r) {
    echo "Email: {$r['email']}, Name: {$r['name']}\n";
}

// Also show users linked to services that have actual sites
echo "\n=== Comptes avec des sites réels ===\n";
$rows = $sqlite->query("
    SELECT u.email, u.name, u.service_id, COUNT(s.id) as nb_sites
    FROM users u
    LEFT JOIN sites s ON s.service_id = u.service_id
    WHERE u.role != 'super_admin'
    GROUP BY u.service_id
    HAVING nb_sites > 0
    ORDER BY nb_sites DESC
    LIMIT 10
");
foreach ($rows as $r) {
    echo " {$r['email']} ({$r['name']}) — service {$r['service_id']} — {$r['nb_sites']} site(s)\n";
}
