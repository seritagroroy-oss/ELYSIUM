<?php
// Test direct de la base de données (sans serveur HTTP)
require_once 'backend/database.php';
require_once 'utils.php';

echo "=== TEST CONNEXION BD ===\n";

// 1. Vérifie si admin@gmail.com existe
$user = getUserByEmail('admin@gmail.com');
if ($user) {
    echo "✅ Utilisateur admin@gmail.com trouvé\n";
    echo "   Nom     : " . $user['name'] . "\n";
    echo "   Role    : " . $user['role'] . "\n";
    echo "   Hash    : " . substr($user['password'], 0, 30) . "...\n";
    $ok = password_verify('admin123', $user['password']);
    echo "   MDP 'admin123' => " . ($ok ? '✅ CORRECT' : '❌ INCORRECT') . "\n";
} else {
    echo "❌ Utilisateur admin@gmail.com INTROUVABLE dans la base\n";
    
    // Lister tous les utilisateurs
    $db = getDb();
    $rows = $db->query("SELECT email, name, role FROM users LIMIT 10");
    echo "\nUtilisateurs existants:\n";
    if (empty($rows)) {
        echo "  (aucun utilisateur dans la base)\n";
    } else {
        foreach ($rows as $r) {
            echo "  - " . $r['email'] . " (" . $r['role'] . ")\n";
        }
    }
}

echo "\n=== TEST ABONNEMENT ===\n";
$state = getUserSubscriptionState('admin@gmail.com');
echo "Status : " . ($state['status'] ?? 'N/A') . "\n";
echo "Accès  : " . ($state['access_allowed'] ? 'OUI' : 'NON') . "\n";
echo "Message: " . ($state['message'] ?? '') . "\n";

echo "\n=== TEST REGISTER SIMULATION ===\n";
$test_email = 'test_diag_' . time() . '@example.com';
try {
    $db = getDb();
    $company_id = 'comp_test_' . rand(1000,9999);
    $stmt = $db->prepare("INSERT INTO entreprises (id, name, owner_email) VALUES (?, ?, ?)");
    $stmt->execute([$company_id, 'Test Register', $test_email]);
    echo "✅ INSERT entreprises OK\n";
    
    $service_id = 'svc_test_' . rand(1000,9999);
    $stmt2 = $db->prepare("INSERT INTO services (id, name, company_id) VALUES (?, ?, ?)");
    $stmt2->execute([$service_id, 'Test Service', $company_id]);
    echo "✅ INSERT services OK\n";
    
    $stmt3 = $db->prepare("INSERT INTO users (email, password, name, role, service, service_id, company_id, permissions, trial_started_at, trial_ends_at, subscription_plan, subscription_price, subscription_currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt3->execute([
        $test_email,
        password_hash('test123', PASSWORD_DEFAULT),
        'Test User',
        'admin',
        'Test Service',
        $service_id,
        $company_id,
        json_encode([]),
        date('Y-m-d H:i:s'),
        date('Y-m-d H:i:s', strtotime('+15 days')),
        'premium_monthly',
        20000,
        'XOF'
    ]);
    echo "✅ INSERT users OK\n";
    
    // Nettoyage
    $db->exec("DELETE FROM users WHERE email = '$test_email'");
    $db->exec("DELETE FROM services WHERE id = '$service_id'");
    $db->exec("DELETE FROM entreprises WHERE id = '$company_id'");
    echo "✅ Nettoyage OK\n";
    
} catch (Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
}
