<?php
require 'backend/database.php';
require 'utils.php';

$userEmail = 'comptara@gmail.com';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$userEmail]);
$user_id = $stmt->fetchColumn();

// Fetch what is_controller_only evaluates to
$userPerms = getUserPermissionsByEmail($userEmail);
$is_controller_only = !empty($userPerms['is_controller_only']);
echo "IS CONTROLLER ONLY: " . ($is_controller_only ? "YES" : "NO") . "\n";

// Fetch delegations
$stmtDelTo = $sqlite->prepare("SELECT site_id FROM pointage_delegations WHERE company_id = ? AND delegated_to = ? AND period = ? AND status = 'active'");
$stmtDelTo->execute(['comp_bb90668e', $user_id, '2058-07']);
$delegatedToMe = $stmtDelTo->fetchAll(PDO::FETCH_COLUMN);
echo "DELEGATED TO ME: " . json_encode($delegatedToMe) . "\n";

// Fetch sites
$stmt = $sqlite->prepare("SELECT id, name FROM sites WHERE company_id = ? AND source_module = 'PC'");
$stmt->execute(['comp_bb90668e']);
$sites = $stmt->fetchAll(PDO::FETCH_ASSOC);

if ($is_controller_only || !empty($delegatedToMe)) {
    $filteredSites = [];
    foreach ($sites as $s) {
        if (in_array($s['id'], $delegatedToMe)) {
            $s['is_controller_mode'] = true;
            $filteredSites[] = $s;
        }
    }
    $sites = $filteredSites;
} else {
    echo "DID NOT FILTER (is_controller_only is false and delegatedToMe is empty)\n";
}

echo "SITES RETURNED: " . json_encode($sites) . "\n";
