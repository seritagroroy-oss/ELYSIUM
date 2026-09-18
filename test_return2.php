<?php
$_SESSION['user_id'] = 'comptara@gmail.com';
require 'backend/database.php';
require 'backend/core/functions.php';

$data = [
    'site_id' => '1787707063_516',
    'period' => '2058-07'
];

$sqlite = getDb();
$company_id   = 'comp_bb90668e';
$current_user = 'comptara@gmail.com';
$site_id = $data['site_id'] ?? '';
$period = $data['period'] ?? '';

if (empty($site_id) || empty($period)) {
    echo json_encode(['success' => false, 'message' => 'site_id ou period manquant.']);
    exit;
}

try {
    $stmtCheck = $sqlite->prepare("SELECT * FROM pointage_delegations WHERE site_id = ? AND period = ? AND delegated_to = ? AND company_id = ? AND status = 'active'");
    $stmtCheck->execute([$site_id, $period, $current_user, $company_id]);
    $delegation = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$delegation) {
        echo json_encode(['success' => false, 'message' => 'Délégation introuvable ou déjà terminée.']);
        exit;
    }

    $delegation_id = $delegation['id'];
    $stmtUpd = $sqlite->prepare("UPDATE pointage_delegations SET status = 'returned', returned_at = NOW() WHERE id = ?");
    $stmtUpd->execute([$delegation_id]);

    $stmtCtrl = $sqlite->prepare("SELECT name FROM users WHERE email = ?");
    $stmtCtrl->execute([$current_user]);
    $ctrl = $stmtCtrl->fetch(PDO::FETCH_ASSOC);
    $ctrl_name = $ctrl['name'] ?? $current_user;

    $notifData = json_encode([
        'delegation_id' => $delegation_id,
        'site_id'       => $site_id,
        'site_name'     => $delegation['site_name'],
        'period'        => $period,
        'returned_by'   => $current_user,
    ]);
    $stmtNotif = $sqlite->prepare("INSERT INTO system_notifications (user_email, company_id, type, title, message, data) VALUES (?,?,?,?,?,?)");
    $stmtNotif->execute([
        $delegation['delegated_by'],
        $company_id,
        'delegation_returned',
        '↩️ Site restitué',
        "Le contrôleur « $ctrl_name » a terminé le traitement et restitué le site « {$delegation['site_name']} » pour la période $period.",
        $notifData
    ]);

    echo json_encode(['success' => true, 'message' => "Le site a été restitué avec succès au service traitant."]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
