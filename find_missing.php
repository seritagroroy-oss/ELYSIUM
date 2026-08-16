<?php
require_once 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT data FROM archives_pointage WHERE id = 106");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    $data = json_decode($row['data'], true);
    $found = [];
    foreach ($data['sites'] as $site) {
        if (isset($site['subsites'])) {
            foreach ($site['subsites'] as $sub) {
                if (isset($sub['agents'])) {
                    foreach ($sub['agents'] as $agent) {
                        if (strpos($agent['name'], 'GOUESSE') !== false || strpos($agent['name'], 'DAGNOGO') !== false) {
                            $found[] = [
                                'site' => $site['name'],
                                'subsite' => $sub['name'],
                                'agent' => $agent['name']
                            ];
                        }
                    }
                }
            }
        }
    }
    print_r($found);
}
