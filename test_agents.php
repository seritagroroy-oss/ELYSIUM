<?php
require_once __DIR__ . '/backend/core/db.php';

function getAgentInfo($name) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT id, name, company_id, shift_type, subsite_id FROM agents WHERE name LIKE :name");
    $stmt->execute(['name' => '%' . $name . '%']);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

echo "KOUAME:\n";
print_r(getAgentInfo('KOUAME KOUASSI ELOI CONSTANT'));

echo "ABEHI:\n";
print_r(getAgentInfo('ABEHI YAPO BONAVENTURE'));
