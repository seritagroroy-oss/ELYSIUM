<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

try {
    $res = $sqlite->query("SELECT * FROM subsites WHERE site_id = 'site_itc' AND company_id = 'comp_cf66d02f'");
    $subs = is_array($res) ? $res : (method_exists($res, 'fetchAll') ? $res->fetchAll(PDO::FETCH_ASSOC) : []);

    echo "Subsites for site_itc in comp_cf66d02f:\n";
    foreach ($subs as $s) {
        echo "ID: {$s['id']}, Name: {$s['name']}, Company: {$s['company_id']}\n";
    }

    // What if company_id is NULL?
    $res2 = $sqlite->query("SELECT * FROM subsites WHERE site_id = 'site_itc'");
    $subs2 = is_array($res2) ? $res2 : (method_exists($res2, 'fetchAll') ? $res2->fetchAll(PDO::FETCH_ASSOC) : []);
    
    echo "\nAll subsites for site_itc:\n";
    foreach ($subs2 as $s) {
        echo "ID: {$s['id']}, Name: {$s['name']}, Company: {$s['company_id']}\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
