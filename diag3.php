<?php
require 'backend/database.php';
$sqlite = getDb();

echo "=== USERS ===\n";
$rows = $sqlite->query("SELECT email, name, role, service_id, service FROM users");
foreach ($rows as $r) {
    echo " email: {$r['email']}, name: {$r['name']}, role: {$r['role']}, service_id: {$r['service_id']}, service: {$r['service']}\n";
}

echo "\n=== Sites par service_id ===\n";
$rows = $sqlite->query("SELECT service_id, COUNT(*) as nb_sites FROM sites GROUP BY service_id");
foreach ($rows as $r) echo " service_id: {$r['service_id']} => {$r['nb_sites']} site(s)\n";

echo "\n=== Agents par service_id ===\n";
$rows = $sqlite->query("SELECT service_id, COUNT(*) as nb FROM agents GROUP BY service_id");
foreach ($rows as $r) echo " service_id: {$r['service_id']} => {$r['nb']} agent(s)\n";

echo "\n=== Attendance par service_id ===\n";
$rows = $sqlite->query("SELECT service_id, period, COUNT(*) as nb FROM attendance GROUP BY service_id, period");
foreach ($rows as $r) echo " service_id: {$r['service_id']}, period: {$r['period']} => {$r['nb']} lignes\n";
