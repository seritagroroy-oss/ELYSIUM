<?php
session_start();
$_SESSION['user_id'] = 'comptara@gmail.com';
$_SESSION['company_id'] = 'test_company'; // L'entreprise où il a la délégation

require_once __DIR__ . '/backend/core/functions.php'; // Pour getDb et resolveCurrentCompanyIdSql

// On simule une requête
$_POST['action'] = 'return_delegated_site';
$data = [
    'site_id' => 'test_site', // On met l'ID du site délégué
    'period' => '2058-07'
];

try {
    $sqlite = getDb();
    $company_id = 'test_company';
    $current_user = 'comptara@gmail.com';
    $site_id = $data['site_id'];
    $period = $data['period'];
    
    // Vérifier que la délégation appartient bien au contrôleur courant
    $stmtCheck = $sqlite->prepare("SELECT * FROM pointage_delegations WHERE site_id = ? AND period = ? AND delegated_to = ? AND company_id = ? AND status = 'active'");
    $stmtCheck->execute([$site_id, $period, $current_user, $company_id]);
    $delegation = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$delegation) {
        echo "Délégation introuvable ou déjà terminée.\n";
        exit;
    }

    echo "Délégation trouvée : " . print_r($delegation, true) . "\n";
    
    // Marquer la délégation comme retournée
    $delegation_id = $delegation['id'];
    $stmtUpd = $sqlite->prepare("UPDATE pointage_delegations SET status = 'returned', returned_at = NOW() WHERE id = ?");
    $stmtUpd->execute([$delegation_id]);

    echo "Update réussi.\n";

    // Récupérer le nom du contrôleur
    $stmtCtrl = $sqlite->prepare("SELECT name FROM users WHERE email = ?");
    $stmtCtrl->execute([$current_user]);
    $ctrl = $stmtCtrl->fetch(PDO::FETCH_ASSOC);
    $ctrl_name = $ctrl['name'] ?? $current_user;

    echo "Nom du controleur : $ctrl_name\n";

    // Créer la notification pour le service traitant
    $notifData = json_encode([
        'delegation_id' => $delegation_id,
        'site_id'       => $delegation['site_id'],
        'site_name'     => $delegation['site_name'],
        'period'        => $delegation['period'],
        'returned_by'   => $current_user,
    ]);
    $stmtNotif = $sqlite->prepare("INSERT INTO system_notifications (user_email, company_id, type, title, message, data) VALUES (?,?,?,?,?,?)");
    $stmtNotif->execute([
        $delegation['delegated_by'],
        $company_id,
        'restitution',
        'Site restitué : ' . $delegation['site_name'],
        "Le contrôleur $ctrl_name a restitué le site pour la période {$delegation['period']}.",
        $notifData
    ]);
    
    echo "Notification insérée avec succès.\n";
    
} catch (Exception $e) {
    echo "Erreur interceptée : " . $e->getMessage() . "\n";
}
