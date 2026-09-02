<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_bb90668e';
$period = '2047-05';
$stmt = $sqlite->prepare("SELECT site_id FROM subsites WHERE id = 'sub_1783962421_7095'");
$stmt->execute();
$site_id = $stmt->fetchColumn();

$stmt_sub = $sqlite->prepare("SELECT id, name FROM subsites WHERE site_id = ? ORDER BY name ASC");
$stmt_sub->execute([$site_id]);
$subsites_rows = $stmt_sub->fetchAll();
$subsite_ids = array_column($subsites_rows, 'id');

$stmt_att = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = '6a7fa22c4a460' AND period = ?");
$stmt_att->execute([$period]);
$agent_attendance = $stmt_att->fetchAll();

$is_relevant = false;
$target_subsite_id = null;

foreach ($agent_attendance as $att) {
    if (strpos($att['status'], 'Suppl|') === 0) {
        $dest = explode('|', $att['status'])[1] ?? '';
        echo "Found Suppl! dest: $dest\n";
        if (in_array($dest, $subsite_ids) || $dest === $site_id) {
            $is_relevant = true;
            echo "IS RELEVANT!\n";
            if (in_array($dest, $subsite_ids)) {
                $target_subsite_id = $dest;
            }
        } else {
            echo "NOT RELEVANT. dest='$dest', site_id='$site_id'\n";
            print_r($subsite_ids);
        }
    }
}
