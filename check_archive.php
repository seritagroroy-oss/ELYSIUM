<?php
require 'backend/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT data FROM archives_pointage ORDER BY id DESC LIMIT 1");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);

$data_raw = $row['data'];
$decoded = base64_decode($data_raw, true);
$uncompressed = @gzuncompress($decoded);
if ($uncompressed !== false) {
    $data_raw = $uncompressed;
}
$data = json_decode($data_raw, true);

foreach ($data['sites'] as $site) {
    if (isset($site['subsites'])) {
        foreach ($site['subsites'] as $subsite) {
            if (isset($subsite['agents'])) {
                foreach ($subsite['agents'] as $ag) {
                    if (strpos($ag['name'], 'SASASA') !== false) {
                        print_r($ag);
                    }
                }
            }
        }
    }
}
