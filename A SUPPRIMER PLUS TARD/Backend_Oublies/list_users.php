<?php
session_start();

// Trouver le bon chemin vers la base de données
$dbPath = __DIR__ . '/elysium.db';
if (!file_exists($dbPath)) {
    $dbPath = __DIR__ . '/database.sqlite';
}
if (!file_exists($dbPath)) {
    $dbPath = __DIR__ . '/elysium.sqlite';
}

echo "Base utilisée: $dbPath\n";
echo "Taille: " . number_format(filesize($dbPath)) . " octets\n\n";

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// Liste des entreprises
echo "=== ENTREPRISES (companies) ===\n";
try {
    $companies = $pdo->query("SELECT * FROM companies ORDER BY name")->fetchAll();
    foreach ($companies as $c) {
        echo "  - ID: " . ($c['id'] ?? '?') . " | Nom: " . ($c['name'] ?? '?') . " | Email: " . ($c['email'] ?? '?') . "\n";
    }
    echo "Total: " . count($companies) . " entreprise(s)\n";
} catch (Exception $e) {
    echo "Table companies: " . $e->getMessage() . "\n";
}

echo "\n=== COMPTES UTILISATEURS (users) ===\n";
try {
    $users = $pdo->query("SELECT id, name, email, role, company_id, created_at FROM users ORDER BY company_id, role")->fetchAll();
    $currentCompany = null;
    foreach ($users as $u) {
        if ($currentCompany !== $u['company_id']) {
            $currentCompany = $u['company_id'];
            echo "\n  [Entreprise: $currentCompany]\n";
        }
        echo "    • " . ($u['name'] ?? '?') . " | Email: " . ($u['email'] ?? '?') . " | Rôle: " . ($u['role'] ?? '?') . "\n";
    }
    echo "\nTotal: " . count($users) . " compte(s)\n";
} catch (Exception $e) {
    echo "Table users: " . $e->getMessage() . "\n";
    
    // Essayer de lister les tables disponibles
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll();
    echo "\nTables disponibles dans la DB:\n";
    foreach ($tables as $t) {
        echo "  - " . $t['name'] . "\n";
    }
}
