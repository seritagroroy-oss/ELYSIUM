<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

try {
    $res = $sqlite->query("SELECT id, email, company_id, name FROM users WHERE company_id IN ('comp_f168e8d9', 'comp_bb90668e', 'comp_cf66d02f')");
    $users = is_array($res) ? $res : (method_exists($res, 'fetchAll') ? $res->fetchAll(PDO::FETCH_ASSOC) : []);

    echo "Users for the 3 companies:\n";
    foreach ($users as $u) {
        echo "Email: {$u['email']}, Company: {$u['company_id']}, Name: {$u['name']}\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
