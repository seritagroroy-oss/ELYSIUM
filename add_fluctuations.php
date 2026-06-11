<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query("SELECT id, permissions FROM services WHERE name LIKE '%comptabilite%'");
if ($res) {
    foreach ($res as $row) {
        $id = $row['id'];
        $perms = json_decode($row['permissions'], true) ?? [];
        if (!in_array('fluctuations', $perms)) {
            $perms[] = 'fluctuations';
            $db->exec("UPDATE services SET permissions='" . json_encode($perms) . "' WHERE id='" . $id . "'");
            echo "Permission 'fluctuations' ajoutee au service " . $id . "\n";
        } else {
            echo "Deja present pour " . $id . "\n";
        }
    }
}
