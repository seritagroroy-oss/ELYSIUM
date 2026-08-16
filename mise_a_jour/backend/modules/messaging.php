<?php
/**
 * Module Messagerie & Tickets
 * Extrait de api_new.php
 */

switch ($action) {

    case 'get_inter_service_messages':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $email = $_SESSION['user_id'] ?? '';
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        // Clean typing states older than 6 seconds
        $now = time();
        $sqlite->prepare("DELETE FROM typing_states WHERE ? - timestamp > 6")->execute([$now]);

        // Fetch typing states for my_service or all, restricted by company
        $stmtTyping = $sqlite->prepare("
            SELECT t.from_service, t.to_service, u.name as user_name
            FROM typing_states t
            JOIN users u ON t.user_email = u.email
            WHERE u.company_id = ? AND (t.to_service = ? OR t.to_service = 'all')
        ");
        $stmtTyping->execute([$company_id, $my_service]);
        $typers = [];
        while ($row = $stmtTyping->fetch()) {
            $typers[] = [
                'from_service' => $row['from_service'],
                'to_service' => $row['to_service'],
                'user_name' => $row['user_name']
            ];
        }

        // Fetch inter service messages
        $stmtMsgs = $sqlite->prepare("
            SELECT * FROM inter_service_messages
            WHERE company_id = ? AND (to_service = ? OR from_service = ? OR to_service = 'all')
            ORDER BY created_at ASC
        ");
        $stmtMsgs->execute([$company_id, $my_service, $my_service]);
        $msgs = $stmtMsgs->fetchAll();

        // Map keys if needed
        $result = [];
        foreach ($msgs as $m) {
            // Fetch reactions for this message
            $stmtReactions = $sqlite->prepare("SELECT emoji, user_email, user_name FROM message_reactions WHERE message_id = ?");
            $stmtReactions->execute([$m['id']]);
            $reactions = $stmtReactions->fetchAll();

            $result[] = [
                'id' => $m['id'],
                'from_service' => $m['from_service'],
                'from_user' => $m['sender'],
                'to_service' => $m['to_service'],
                'content' => $m['content'],
                'timestamp' => $m['created_at'],
                'reply_to' => $m['reply_to'] ?? '',
                'attachment' => $m['attachment'] ?? '',
                'attachment_name' => $m['attachment_name'] ?? '',
                'reactions' => $reactions
            ];
        }

        echo json_encode(['success' => true, 'messages' => $result, 'typers' => $typers]);
        break;

    case 'send_inter_service_message':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $content = trim($data['content'] ?? '');
        $to_service = trim($data['to_service'] ?? '');
        $reply_to = trim($data['reply_to'] ?? '');
        $attachment = trim($data['attachment'] ?? '');
        $attachment_name = trim($data['attachment_name'] ?? '');

        if ($content === '' && $attachment === '') {
            echo json_encode(['success' => false, 'message' => 'Contenu ou pièce jointe requis']);
            break;
        }
        if ($to_service === '') {
            echo json_encode(['success' => false, 'message' => 'Destinataire requis']);
            break;
        }

        $msg_id = 'ism_' . time() . '_' . rand(100, 999);
        $from_user = (string) ($_SESSION['user_name'] ?? 'Utilisateur');

        $stmtIns = $sqlite->prepare("
            INSERT INTO inter_service_messages (id, from_service, to_service, sender, content, attachment, attachment_name, reply_to, created_at, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtIns->execute([
            $msg_id,
            $my_service,
            $to_service,
            $from_user,
            $content,
            $attachment !== '' ? $attachment : null,
            $attachment_name !== '' ? $attachment_name : null,
            $reply_to !== '' ? $reply_to : null,
            date('Y-m-d H:i:s'),
            $company_id
        ]);

        echo json_encode(['success' => true]);
        break;

    case 'react_to_message':
        $sqlite = getDb();
        $message_id = trim($data['message_id'] ?? '');
        $emoji = trim($data['emoji'] ?? '');
        $email = $_SESSION['user_id'] ?? '';
        $user_name = $_SESSION['user_name'] ?? 'Utilisateur';
        if ($message_id === '' || $emoji === '' || $email === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }

        $stmt = $sqlite->prepare("SELECT 1 FROM message_reactions WHERE message_id = ? AND emoji = ? AND user_email = ?");
        $stmt->execute([$message_id, $emoji, $email]);
        $exists = $stmt->fetch();

        if ($exists) {
            $stmtDel = $sqlite->prepare("DELETE FROM message_reactions WHERE message_id = ? AND emoji = ? AND user_email = ?");
            $stmtDel->execute([$message_id, $emoji, $email]);
        } else {
            $stmtIns = $sqlite->prepare("INSERT INTO message_reactions (message_id, emoji, user_email, user_name) VALUES (?, ?, ?, ?)");
            $stmtIns->execute([$message_id, $emoji, $email, $user_name]);
        }

        echo json_encode(['success' => true]);
        break;
    case 'create_ticket':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $title = trim($data['title'] ?? '');
        $content = trim($data['content'] ?? '');
        $to_service = trim($data['to_service'] ?? '');
        $priority = trim($data['priority'] ?? 'medium');
        $tags = $data['tags'] ?? [];
        if ($title === '' || $to_service === '') {
            echo json_encode(['success' => false, 'message' => 'Titre et destinataire requis']);
            break;
        }

        $auto_assigned_to = '';
        $auto_assigned_name = '';
        $lower_title = strtolower($title . ' ' . $content);
        $target_keyword = '';
        if (strpos($lower_title, 'salaire') !== false || strpos($lower_title, 'facture') !== false || strpos($lower_title, 'paye') !== false || strpos($lower_title, 'compta') !== false) {
            $target_keyword = 'compta';
        } elseif (strpos($lower_title, 'panne') !== false || strpos($lower_title, 'informatique') !== false || strpos($lower_title, 'scanner') !== false || strpos($lower_title, 'bug') !== false || strpos($lower_title, 'internet') !== false) {
            $target_keyword = 'tech';
        } elseif (strpos($lower_title, 'recrutement') !== false || strpos($lower_title, 'embauche') !== false || strpos($lower_title, 'rh') !== false || strpos($lower_title, 'conge') !== false) {
            $target_keyword = 'rh';
        }

        if ($target_keyword !== '') {
            $stmtSvc = $sqlite->prepare("SELECT id, name FROM services WHERE LOWER(name) LIKE ?");
            $stmtSvc->execute(['%' . $target_keyword . '%']);
            $svc = $stmtSvc->fetch();
            if ($svc) {
                $auto_assigned_to = $svc['id'];
                $auto_assigned_name = $svc['name'];
            }
        }

        $ticket_id = 'tk_' . time() . '_' . rand(100, 999);
        $from_user = (string) ($_SESSION['user_name'] ?? 'Utilisateur');
        $from_user_email = (string) ($_SESSION['user_id'] ?? '');

        $stmtIns = $sqlite->prepare("INSERT INTO tickets (id, from_service, to_service, from_user, from_user_email, title, content, status, priority, created_at, assigned_to, assigned_name) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP, ?, ?)");
        $stmtIns->execute([$ticket_id, $my_service, $to_service, $from_user, $from_user_email, $title, $content, $priority, $auto_assigned_to !== '' ? $auto_assigned_to : null, $auto_assigned_name !== '' ? $auto_assigned_name . ' (Auto-assigné)' : null]);

        foreach ($tags as $tag) {
            $sqlite->prepare("INSERT INTO ticket_tags (ticket_id, tag) VALUES (?, ?)")->execute([$ticket_id, $tag]);
        }

        echo json_encode(['success' => true]);
        break;
    case 'get_pending_password_resets':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $company_id = $_SESSION['company_id'] ?? '';
        $role = $_SESSION['user_role'] ?? '';
        if ($role !== 'admin' && $role !== 'super_admin') {
            echo json_encode(['success' => true, 'count' => 0, 'users' => []]);
            break;
        }

        $sqlite = getDb();
        if ($role === 'super_admin') {
            $stmt = $sqlite->query("SELECT email, name, service_id, password_reset_requested_at FROM users WHERE password_reset_requested_at IS NOT NULL");
        } else {
            $stmt = $sqlite->prepare("SELECT email, name, service_id, password_reset_requested_at FROM users WHERE company_id = ? AND password_reset_requested_at IS NOT NULL");
            $stmt->execute([$company_id]);
        }
        $pending = [];
        while ($row = $stmt->fetch()) {
            $pending[] = $row;
        }
        echo json_encode(['success' => true, 'count' => count($pending), 'users' => $pending]);
        break;
    case 'get_tickets':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $role = $_SESSION['user_role'] ?? '';

        $sql = "SELECT * FROM tickets";
        $params = [];
        if ($role !== 'super_admin') {
            $sql .= " WHERE to_service = ? OR from_service = ?";
            $params = [$my_service, $my_service];
        }
        $stmt = $sqlite->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetchAll();

        // Fetch tags and comments for each
        foreach ($result as &$t) {
            $stmtTags = $sqlite->prepare("SELECT tag FROM ticket_tags WHERE ticket_id = ?");
            $stmtTags->execute([$t['id']]);
            $tags_rows = $stmtTags->fetchAll();
            $t['tags'] = array_map(fn($r) => array_values($r)[0], $tags_rows);

            $stmtComms = $sqlite->prepare("SELECT * FROM ticket_comments WHERE ticket_id = ?");
            $stmtComms->execute([$t['id']]);
            $t['comments'] = $stmtComms->fetchAll();
            $t['activities'] = []; // Activities could be fetched similarly if normalized, kept empty for brevity
        }

        echo json_encode(['success' => true, 'tickets' => $result]);
        break;
    case 'update_ticket_status':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $status = trim($data['status'] ?? '');

        $stmt = $sqlite->prepare("UPDATE tickets SET status = ? WHERE id = ?");
        $stmt->execute([$status, $ticket_id]);
        $found = $stmt->rowCount() > 0;

        echo json_encode(['success' => $found]);
        break;
    case 'assign_ticket':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $assigned_to = trim($data['assigned_to'] ?? '');
        $assigned_name = trim($data['assigned_name'] ?? '');

        $stmt = $sqlite->prepare("UPDATE tickets SET assigned_to = ?, assigned_name = ? WHERE id = ?");
        $stmt->execute([$assigned_to, $assigned_name, $ticket_id]);
        $found = $stmt->rowCount() > 0;

        echo json_encode(['success' => $found]);
        break;
    case 'add_ticket_comment':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $comment = trim($data['comment'] ?? '');
        $email = $_SESSION['user_id'] ?? '';
        $user_name = $_SESSION['user_name'] ?? 'Utilisateur';

        if ($comment === '') {
            echo json_encode(['success' => false, 'message' => 'Commentaire vide']);
            break;
        }

        $stmt = $sqlite->prepare("INSERT INTO ticket_comments (id, ticket_id, user_name, user_email, content) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['tc_' . time() . '_' . rand(100, 999), $ticket_id, $user_name, $email, $comment]);

        echo json_encode(['success' => true]);
        break;
    case 'get_services_list':
        $sqlite = getDb();
        $user_id = $_SESSION['user_id'] ?? '';
        $company_id = $_SESSION['company_id'] ?? '';
        $role = $_SESSION['user_role'] ?? '';
        
        $sql = "SELECT id, name FROM services";
        $params = [];
        if ($role !== 'super_admin') {
            $sql .= " WHERE company_id = ?";
            $params[] = $company_id;
        }
        $stmt = $sqlite->prepare($sql);
        $stmt->execute($params);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($services as $svc) {
            $result[] = [
                'id' => $svc['id'],
                'name' => $svc['name'],
                'is_online' => true // Simplified online status for now
            ];
        }
        echo json_encode(['success' => true, 'services' => $result]);
        break;
    case 'set_typing_status':
        $sqlite = getDb();
        $db = getData(); // Legacy fallback
        $my_service = resolveCurrentServiceKey($db);
        $to_service = trim($data['to_service'] ?? '');
        $is_typing = !empty($data['is_typing']);
        $email = $_SESSION['user_id'] ?? '';
        $user_name = $_SESSION['user_name'] ?? 'Utilisateur';
        if ($to_service === '' || $email === '') {
            echo json_encode(['success' => false]);
            break;
        }
        if ($is_typing) {
            $stmt = $sqlite->prepare("INSERT OR REPLACE INTO typing_states (from_service, to_service, user_email, timestamp) VALUES (?, ?, ?, ?)");
            $stmt->execute([$my_service, $to_service, $email, time()]);
        } else {
            $stmt = $sqlite->prepare("DELETE FROM typing_states WHERE from_service = ? AND to_service = ? AND user_email = ?");
            $stmt->execute([$my_service, $to_service, $email]);
        }
        echo json_encode(['success' => true]);
        break;
    case 'toggle_pin_message':
        $sqlite = getDb();
        $message_id = trim($data['message_id'] ?? '');
        if ($message_id === '') {
            echo json_encode(['success' => false, 'message' => 'ID de message manquant']);
            break;
        }

        $stmtCheck = $sqlite->prepare("SELECT is_pinned FROM inter_service_messages WHERE id = ?");
        $stmtCheck->execute([$message_id]);
        $row = $stmtCheck->fetch();
        if (!$row) {
            echo json_encode(['success' => false, 'message' => 'Message non trouvé']);
            break;
        }

        $new_pin = $row['is_pinned'] ? 0 : 1;

        $stmtUp = $sqlite->prepare("UPDATE inter_service_messages SET is_pinned = ? WHERE id = ?");
        $stmtUp->execute([$new_pin, $message_id]);

        echo json_encode(['success' => true]);
        break;

    case 'rate_ticket':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $rating = (int) ($data['rating'] ?? 0);
        $comment = trim($data['comment'] ?? '');
        if ($ticket_id === '' || $rating < 1 || $rating > 5) {
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
            break;
        }

        $stmt = $sqlite->prepare("UPDATE tickets SET rating = ?, rating_comment = ? WHERE id = ?");
        $stmt->execute([$rating, $comment, $ticket_id]);
        $found = $stmt->rowCount() > 0;

        if ($found) {
            $email = $_SESSION['user_id'] ?? '';
            $user_name = $_SESSION['user_name'] ?? 'Utilisateur';
            $activityMsg = "A évalué le ticket : " . $rating . "/5. Commentaire : " . $comment;
            $stmtComm = $sqlite->prepare("INSERT INTO ticket_comments (id, ticket_id, user_name, user_email, content) VALUES (?, ?, ?, ?, ?)");
            $stmtComm->execute(['tc_' . time() . '_' . rand(100, 999), $ticket_id, $user_name, $email, $activityMsg]);

            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Ticket non trouvé']);
        }
        break;

    case 'set_lang':
        $new_lang = $data['lang'] ?? 'fr';
        $_SESSION['lang'] = $new_lang;
        echo json_encode(['success' => true]);
        break;

} // end switch messaging
