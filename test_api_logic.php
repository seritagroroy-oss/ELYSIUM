<?php
require 'backend/database.php';
require 'utils.php';

$userEmail = 'comptara@gmail.com';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$userEmail]);
$user_id = $stmt->fetchColumn();

$_SESSION['user_id'] = $user_id;

$company_id = 'comp_bb90668e';
$period = '2058-07';

// Simulation of logic inside pointage.php
$sites = [
    ['id' => '1787707063_516', 'name' => 'ADMINISTRATION'],
    ['id' => 'site_releves', 'name' => 'Vivier des relèves']
];

$uEmail = $userEmail;
$userPerms = getUserPermissionsByEmail($uEmail);
$is_controller_only = !empty($userPerms['is_controller_only']);

$stmtDelTo = $sqlite->prepare("SELECT site_id FROM pointage_delegations WHERE company_id = ? AND delegated_to = ? AND period = ? AND status = 'active'");
$stmtDelTo->execute([$company_id, $user_id, $period]);
$delegatedToMe = $stmtDelTo->fetchAll(PDO::FETCH_COLUMN);

echo "is_controller_only: " . ($is_controller_only ? 'true' : 'false') . "\n";
echo "delegatedToMe: " . json_encode($delegatedToMe) . "\n";
echo "userPerms: " . json_encode($userPerms) . "\n";

if ($is_controller_only || !empty($delegatedToMe)) {
    $filteredSites = [];
    foreach ($sites as $s) {
        if (in_array($s['id'], $delegatedToMe)) {
            $s['is_controller_mode'] = true;
            $filteredSites[] = $s;
        }
    }
    $sites = $filteredSites;
}

$has_releves = false;
foreach ($sites as $s) {
    if ($s['id'] === 'site_releves') $has_releves = true;
}

if (!$has_releves && empty($delegatedToMe) && !$is_controller_only) {
    $sites[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
}

echo "final sites: " . json_encode($sites) . "\n";
