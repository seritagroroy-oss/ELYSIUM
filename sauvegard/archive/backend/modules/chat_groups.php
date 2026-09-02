<?php
/**
 * Module Groupes de Chat & Appels
 * Extrait de api_new.php
 */

switch ($action) {
    case 'create_message_group':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $is_announcement = !empty($data['is_announcement']) ? 1 : 0;
        
        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Nom requis']);
            break;
        }
        
        $group_id = 'grp_' . time() . '_' . rand(1000, 9999);
        
        $sqlite->prepare("INSERT INTO message_groups (id, name, description, is_announcement, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?)")
               ->execute([$group_id, $name, $description, $is_announcement, $company_id, $user_email]);
               
        // Add creator as admin
        $sqlite->prepare("INSERT INTO message_group_members (group_id, user_email, role) VALUES (?, ?, 'admin')")
               ->execute([$group_id, $user_email]);
               
        // Add other members if provided
        $members = $data['members'] ?? [];
        if (is_array($members)) {
            foreach ($members as $member_email) {
                if ($member_email !== $user_email) {
                    $sqlite->prepare("INSERT IGNORE INTO message_group_members (group_id, user_email, role) VALUES (?, ?, 'member')")
                           ->execute([$group_id, $member_email]);
                }
            }
        }
        
        echo json_encode(['success' => true, 'group_id' => $group_id]);
        break;

    case 'get_message_groups':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        
        // Groups the user is a member of
        $stmt = $sqlite->prepare("
            SELECT g.*, m.role 
            FROM message_groups g
            JOIN message_group_members m ON g.id = m.group_id
            WHERE g.company_id = ? AND m.user_email = ?
        ");
        $stmt->execute([$company_id, $user_email]);
        $groups = $stmt->fetchAll();
        
        // Also fetch members of these groups
        foreach ($groups as &$g) {
            $stmtM = $sqlite->prepare("SELECT u.name, u.email, m.role, u.profile_photo FROM message_group_members m JOIN users u ON m.user_email = u.email WHERE m.group_id = ?");
            $stmtM->execute([$g['id']]);
            $g['members'] = $stmtM->fetchAll();
        }
        
        echo json_encode(['success' => true, 'groups' => $groups]);
        break;

    case 'send_group_message':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $content = trim($data['content'] ?? '');
        $attachment = trim($data['attachment'] ?? '');
        $attachment_name = trim($data['attachment_name'] ?? '');
        
        if ($group_id === '' || ($content === '' && $attachment === '')) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        // Verify membership
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member) {
            echo json_encode(['success' => false, 'message' => 'Non autorisé']);
            break;
        }
        
        // Check if announcement channel
        $stmtG = $sqlite->prepare("SELECT is_announcement FROM message_groups WHERE id = ? AND company_id = ?");
        $stmtG->execute([$group_id, $company_id]);
        $grp = $stmtG->fetch();
        if ($grp && $grp['is_announcement'] == 1 && $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Seuls les administrateurs peuvent publier']);
            break;
        }
        
        $msg_id = 'gmsg_' . time() . '_' . rand(1000, 9999);
        $sqlite->prepare("INSERT INTO group_messages (id, group_id, sender_email, content, attachment, attachment_name) VALUES (?, ?, ?, ?, ?, ?)")
               ->execute([$msg_id, $group_id, $user_email, $content, $attachment, $attachment_name]);
               
        echo json_encode(['success' => true]);
        break;

    case 'get_group_messages':
        $sqlite = getDb();
        $group_id = trim($data['group_id'] ?? '');
        $user_email = $_SESSION['user_id'] ?? '';
        
        // Verify membership
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        if (!$stmtCheck->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Non autorisé']);
            break;
        }
        
        $stmt = $sqlite->prepare("
            SELECT m.*, u.name as sender_name, u.profile_photo 
            FROM group_messages m 
            JOIN users u ON m.sender_email = u.email 
            WHERE m.group_id = ? 
            ORDER BY m.created_at ASC
        ");
        $stmt->execute([$group_id]);
        $messages = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'messages' => $messages]);
        break;

    case 'post_status':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $content = trim($data['content'] ?? '');
        $content_type = trim($data['content_type'] ?? 'text'); // text or image
        $bg_color = trim($data['bg_color'] ?? '#075e54');
        
        if ($content === '') {
            echo json_encode(['success' => false, 'message' => 'Contenu requis']);
            break;
        }
        
        $status_id = 'stat_' . time() . '_' . rand(100, 999);
        $expires_at = date('Y-m-d H:i:s', time() + (24 * 3600)); // 24 hours
        
        $sqlite->prepare("INSERT INTO user_statuses (id, user_email, company_id, content_type, content, bg_color, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
               ->execute([$status_id, $user_email, $company_id, $content_type, $content, $bg_color, $expires_at]);
               
        echo json_encode(['success' => true]);
        break;

    case 'get_statuses':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $now = date('Y-m-d H:i:s');
        
        // Delete expired statuses
        $sqlite->prepare("DELETE FROM user_statuses WHERE expires_at < ?")->execute([$now]);
        
        // Get statuses for my company, grouped by user
        $stmt = $sqlite->prepare("
            SELECT s.*, u.name as user_name, u.profile_photo 
            FROM user_statuses s
            JOIN users u ON s.user_email = u.email
            WHERE s.company_id = ? AND s.expires_at >= ?
            ORDER BY s.created_at ASC
        ");
        $stmt->execute([$company_id, $now]);
        $rows = $stmt->fetchAll();
        
        $statuses_by_user = [];
        foreach ($rows as $row) {
            $email = $row['user_email'];
            if (!isset($statuses_by_user[$email])) {
                $statuses_by_user[$email] = [
                    'user_email' => $email,
                    'user_name' => $row['user_name'],
                    'profile_photo' => $row['profile_photo'],
                    'statuses' => []
                ];
            }
            $statuses_by_user[$email]['statuses'][] = [
                'id' => $row['id'],
                'content_type' => $row['content_type'],
                'content' => $row['content'],
                'bg_color' => $row['bg_color'] ?? '#075e54',
                'created_at' => $row['created_at'],
                'expires_at' => $row['expires_at']
            ];
        }
        
        echo json_encode(['success' => true, 'statuses' => array_values($statuses_by_user)]);
        break;

    case 'upload_file':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        if (empty($_FILES['file'])) {
            echo json_encode(['success' => false, 'message' => 'Aucun fichier reçu']);
            break;
        }
        $type = trim($data['type'] ?? $_POST['type'] ?? 'chat');
        if (!in_array($type, ['chat', 'group', 'status'], true)) {
            $type = 'chat';
        }
        $uploadDir = __DIR__ . '/uploads/' . $type . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $file_name = basename($_FILES['file']['name']);
        $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        $forbidden_exts = ['php', 'phtml', 'html', 'js', 'exe', 'bat', 'sh', 'pl', 'py', 'htaccess'];
        if (in_array($ext, $forbidden_exts, true)) {
            echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé']);
            break;
        }
        
        $uniqueName = uniqid($type . '_') . '.' . $ext;
        $targetPath = $uploadDir . $uniqueName;
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            $url = 'uploads/' . $type . '/' . $uniqueName;
            echo json_encode(['success' => true, 'url' => $url, 'name' => $file_name]);
        } else {
            $errCode = $_FILES['file']['error'] ?? 'unknown';
            echo json_encode(['success' => false, 'message' => "Erreur lors du déplacement du fichier. Code erreur: " . $errCode]);
        }
        break;

    case 'update_group_info':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        
        if ($group_id === '' || $name === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent modifier ses informations.']);
            break;
        }
        
        $sqlite->prepare("UPDATE message_groups SET name = ?, description = ? WHERE id = ? AND company_id = ?")
               ->execute([$name, $description, $group_id, $company_id]);
                
        echo json_encode(['success' => true]);
        break;

    case 'update_group_photo':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $photo_url = trim($data['photo_url'] ?? '');
        
        if ($group_id === '' || $photo_url === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent modifier sa photo.']);
            break;
        }
        
        $sqlite->prepare("UPDATE message_groups SET icon = ? WHERE id = ? AND company_id = ?")
               ->execute([$photo_url, $group_id, $company_id]);
                
        echo json_encode(['success' => true]);
        break;

    case 'add_group_member':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $member_email = trim($data['member_email'] ?? '');
        
        if ($group_id === '' || $member_email === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent ajouter des membres.']);
            break;
        }
        
        $stmtUser = $sqlite->prepare("SELECT email FROM users WHERE email = ? AND company_id = ? AND status = 'active'");
        $stmtUser->execute([$member_email, $company_id]);
        if (!$stmtUser->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable dans cette entreprise']);
            break;
        }
        
        $sqlite->prepare("INSERT IGNORE INTO message_group_members (group_id, user_email, role) VALUES (?, ?, 'member')")
               ->execute([$group_id, $member_email]);
                
        echo json_encode(['success' => true]);
        break;

    case 'remove_group_member':
        $sqlite = getDb();
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $member_email = trim($data['member_email'] ?? '');
        
        if ($group_id === '' || $member_email === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent retirer des membres.']);
            break;
        }
        
        $sqlite->prepare("DELETE FROM message_group_members WHERE group_id = ? AND user_email = ?")
               ->execute([$group_id, $member_email]);
                
        echo json_encode(['success' => true]);
        break;

    case 'change_member_role':
        $sqlite = getDb();
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $member_email = trim($data['member_email'] ?? '');
        $role = trim($data['role'] ?? 'member');
        
        if ($group_id === '' || $member_email === '' || !in_array($role, ['admin', 'member'], true)) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent modifier les rôles.']);
            break;
        }
        
        $sqlite->prepare("UPDATE message_group_members SET role = ? WHERE group_id = ? AND user_email = ?")
               ->execute([$role, $group_id, $member_email]);
                
        echo json_encode(['success' => true]);
        break;

    case 'leave_group':
        $sqlite = getDb();
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        
        if ($group_id === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $sqlite->prepare("DELETE FROM message_group_members WHERE group_id = ? AND user_email = ?")
               ->execute([$group_id, $user_email]);
                
        $stmtCount = $sqlite->prepare("SELECT COUNT(*) as count FROM message_group_members WHERE group_id = ?");
        $stmtCount->execute([$group_id]);
        $count = $stmtCount->fetch()['count'];
        if ($count > 0) {
            $stmtAdmins = $sqlite->prepare("SELECT COUNT(*) as count FROM message_group_members WHERE group_id = ? AND role = 'admin'");
            $stmtAdmins->execute([$group_id]);
            if ($stmtAdmins->fetch()['count'] == 0) {
                $stmtOldest = $sqlite->prepare("SELECT user_email FROM message_group_members WHERE group_id = ? ORDER BY joined_at ASC LIMIT 1");
                $stmtOldest->execute([$group_id]);
                $oldest = $stmtOldest->fetch();
                if ($oldest) {
                    $sqlite->prepare("UPDATE message_group_members SET role = 'admin' WHERE group_id = ? AND user_email = ?")
                           ->execute([$group_id, $oldest['user_email']]);
                }
            }
        } else {
            $sqlite->prepare("DELETE FROM message_groups WHERE id = ?")->execute([$group_id]);
            $sqlite->prepare("DELETE FROM group_messages WHERE group_id = ?")->execute([$group_id]);
        }
        
        echo json_encode(['success' => true]);
        break;

    case 'start_call':
        $sqlite = getDb();
        $caller = $_SESSION['user_id'] ?? '';
        $receiver = trim($data['receiver_email'] ?? '');
        $type = trim($data['type'] ?? 'video');
        
        if ($caller === '' || $receiver === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $sqlite->exec("DELETE FROM active_calls WHERE created_at < datetime('now', '-5 minutes')");
        
        $sqlite->prepare("DELETE FROM active_calls WHERE caller_email = ? OR receiver_email = ?")
               ->execute([$caller, $caller]);
         
        $call_id = 'call_' . time() . '_' . rand(1000, 9999);
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $room_name = 'elysium_' . $company_id . '_' . preg_replace('/[^a-zA-Z0-9]/', '_', min($caller, $receiver)) . '_' . preg_replace('/[^a-zA-Z0-9]/', '_', max($caller, $receiver)) . '_' . $type;
        
        $sqlite->prepare("INSERT INTO active_calls (id, caller_email, receiver_email, room_name, type, status) VALUES (?, ?, ?, ?, ?, 'ringing')")
               ->execute([$call_id, $caller, $receiver, $room_name, $type]);
                
        echo json_encode(['success' => true, 'call' => [
            'id' => $call_id,
            'caller_email' => $caller,
            'receiver_email' => $receiver,
            'room_name' => $room_name,
            'type' => $type,
            'status' => 'ringing'
        ]]);
        break;

    case 'check_incoming_call':
        $sqlite = getDb();
        $user_email = $_SESSION['user_id'] ?? '';
        
        if ($user_email === '') {
            echo json_encode(['success' => false]);
            break;
        }
        
        $stmt = $sqlite->prepare("
            SELECT c.*, u.name as caller_name, u.profile_photo as caller_photo
            FROM active_calls c
            JOIN users u ON c.caller_email = u.email
            WHERE c.receiver_email = ? AND c.status = 'ringing' AND c.created_at >= datetime('now', '-30 seconds')
            ORDER BY c.created_at DESC LIMIT 1
        ");
        $stmt->execute([$user_email]);
        $call = $stmt->fetch();
        
        if ($call) {
            echo json_encode(['success' => true, 'call' => $call]);
        } else {
            echo json_encode(['success' => false]);
        }
        break;

    case 'accept_call':
        $sqlite = getDb();
        $call_id = trim($data['call_id'] ?? '');
        if ($call_id === '') { echo json_encode(['success' => false]); break; }
        $sqlite->prepare("UPDATE active_calls SET status = 'connected' WHERE id = ?")->execute([$call_id]);
        echo json_encode(['success' => true]);
        break;
        
    case 'reject_call':
        $sqlite = getDb();
        $call_id = trim($data['call_id'] ?? '');
        if ($call_id === '') { echo json_encode(['success' => false]); break; }
        $sqlite->prepare("UPDATE active_calls SET status = 'rejected' WHERE id = ?")->execute([$call_id]);
        echo json_encode(['success' => true]);
        break;
        
    case 'end_call':
        $sqlite = getDb();
        $call_id = trim($data['call_id'] ?? '');
        if ($call_id === '') { echo json_encode(['success' => false]); break; }
        $sqlite->prepare("UPDATE active_calls SET status = 'ended' WHERE id = ?")->execute([$call_id]);
        echo json_encode(['success' => true]);
        break;

    case 'check_call_status':
        $sqlite = getDb();
        $call_id = trim($data['call_id'] ?? '');
        if ($call_id === '') { echo json_encode(['success' => false]); break; }
        $stmt = $sqlite->prepare("SELECT * FROM active_calls WHERE id = ?");
        $stmt->execute([$call_id]);
        $call = $stmt->fetch();
        if ($call) {
            echo json_encode(['success' => true, 'status' => $call['status'], 'call' => $call]);
        } else {
            echo json_encode(['success' => false, 'status' => 'ended']);
        }
        break;

    case 'view_status':
        $sqlite = getDb();
        $viewer = $_SESSION['user_id'] ?? '';
        $status_id = trim($data['status_id'] ?? '');
        
        if ($viewer === '' || $status_id === '') {
            echo json_encode(['success' => false]);
            break;
        }
        
        $stmtCheckOwn = $sqlite->prepare("SELECT user_email FROM user_statuses WHERE id = ?");
        $stmtCheckOwn->execute([$status_id]);
        $statusOwner = $stmtCheckOwn->fetch();
        if ($statusOwner && $statusOwner['user_email'] !== $viewer) {
            $sqlite->prepare("INSERT IGNORE INTO status_views (status_id, viewer_email) VALUES (?, ?)")
                   ->execute([$status_id, $viewer]);
        }
        
        echo json_encode(['success' => true]);
        break;

    case 'get_status_views':
        $sqlite = getDb();
        $status_id = trim($data['status_id'] ?? '');
        
        if ($status_id === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètre invalide']);
            break;
        }
        
        $stmt = $sqlite->prepare("
            SELECT sv.*, u.name as viewer_name, u.profile_photo as viewer_photo
            FROM status_views sv
            JOIN users u ON sv.viewer_email = u.email
            WHERE sv.status_id = ?
            ORDER BY sv.viewed_at DESC
        ");
        $stmt->execute([$status_id]);
        $views = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'views' => $views]);
        break;


} // end switch chat_groups
