<?php
require 'backend/database.php';
$sqlite = getDb();

echo "=== SERVICES table ===\n";
$rows = $sqlite->query("SELECT id, name, company_id FROM services");
foreach ($rows as $r) {
    echo " id: {$r['id']}, name: {$r['name']}, company_id: {$r['company_id']}\n";
}

echo "\n=== Sites orphelins (service_id pas dans users) ===\n";
$rows = $sqlite->query("
    SELECT s.service_id, s.name as site_name, COUNT(ag.id) as nb_agents
    FROM sites s
    LEFT JOIN agents ag ON ag.service_id = s.service_id
    WHERE s.service_id NOT IN (SELECT service_id FROM users WHERE service_id IS NOT NULL)
    GROUP BY s.service_id, s.name
    ORDER BY nb_agents DESC
");
foreach ($rows as $r) {
    echo " service: {$r['service_id']}, site: {$r['site_name']}, agents: {$r['nb_agents']}\n";
}

echo "\n=== Quel user a le plus de pointage (attendance) ? ===\n";
$rows = $sqlite->query("
    SELECT u.email, u.name, u.service_id, COUNT(a.id) as nb_att
    FROM users u
    JOIN attendance a ON a.service_id = u.service_id
    GROUP BY u.service_id
    ORDER BY nb_att DESC
    LIMIT 5
");
foreach ($rows as $r) {
    echo " {$r['email']} ({$r['name']}) — service {$r['service_id']} — {$r['nb_att']} lignes d'attendance\n";
}
