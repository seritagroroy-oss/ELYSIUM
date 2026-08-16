<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../utils.php';

$sqlite = getDb();
$users = $sqlite->query("SELECT id, permissions, email, workspace_type FROM users");

$count = 0;
foreach ($users as $u) {
    if ($u['workspace_type'] === 'COMPTABLE' || stripos($u['email'], 'compta') !== false) {
        $perms = json_decode($u['permissions'], true);
        if (is_array($perms)) {
            // Some old arrays might be just lists of strings
            if (isset($perms[0]) && is_string($perms[0])) {
                $newPerms = [];
                foreach ($perms as $p) {
                    $newPerms[$p] = 'write';
                }
                $perms = $newPerms;
            }
        } else {
            $perms = [];
        }
        
        $perms['company_config'] = 'write';
        
        $upd = $sqlite->prepare("UPDATE users SET permissions = ? WHERE id = ?");
        $upd->execute([json_encode($perms), $u['id']]);
        $count++;
        echo "Updated permissions for user: " . $u['email'] . "\n";
    }
}
echo "Total updated: $count\n";
