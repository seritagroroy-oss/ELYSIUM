<?php
// Script pour nettoyer les comptes de simulation sans casser l'accès principal
$dbPath = __DIR__ . '/elysium.db';
if (!file_exists($dbPath)) {
    $dbPath = __DIR__ . '/database.sqlite';
}
if (!file_exists($dbPath)) {
    $dbPath = __DIR__ . '/elysium.sqlite';
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // On compte le nombre total d'utilisateurs avant
    $totalBefore = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

    // On supprime tous les utilisateurs SAUF le compte super_admin (admin@gmail.com) 
    // pour que vous puissiez toujours vous connecter à la plateforme
    $stmt = $pdo->prepare("DELETE FROM users WHERE email != ?");
    $stmt->execute(['admin@gmail.com']);
    $deleted = $stmt->rowCount();

    $totalAfter = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

    echo json_encode([
        'success' => true,
        'message' => "Nettoyage effectué.",
        'deleted_count' => $deleted,
        'remaining_count' => $totalAfter,
        'kept_account' => 'admin@gmail.com'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
