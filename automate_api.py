import re

with open('api.php', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # react_to_message
    (r"    case 'react_to_message':\s+.*?(?=\n    case ')",
     r"""    case 'react_to_message':
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
        break;"""),

    # create_ticket
    (r"    case 'create_ticket':\s+.*?(?=\n    case ')",
     r"""    case 'create_ticket':
        $sqlite = getDb();
        $db = getData(); // Legacy
        $my_service = resolveCurrentServiceKey($db);
        $title = trim($data['title'] ?? '');
        $content = trim($data['content'] ?? '');
        $to_service = trim($data['to_service'] ?? '');
        $priority = trim($data['priority'] ?? 'medium');
        $tags = $data['tags'] ?? [];
        if ($title === '' || $to_service === '') {
             echo json_encode(['success' => false, 'message' => 'Titre et destinataire requis']); break;
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

        $ticket_id = 'tk_'.time().'_'.rand(100,999);
        $from_user = (string)($_SESSION['user_name'] ?? 'Utilisateur');
        $from_user_email = (string)($_SESSION['user_id'] ?? '');

        $stmtIns = $sqlite->prepare("INSERT INTO tickets (id, from_service, to_service, from_user, from_user_email, title, content, status, priority, created_at, assigned_to, assigned_name) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP, ?, ?)");
        $stmtIns->execute([$ticket_id, $my_service, $to_service, $from_user, $from_user_email, $title, $content, $priority, $auto_assigned_to !== '' ? $auto_assigned_to : null, $auto_assigned_name !== '' ? $auto_assigned_name . ' (Auto-assigné)' : null]);

        foreach ($tags as $tag) {
            $sqlite->prepare("INSERT INTO ticket_tags (ticket_id, tag) VALUES (?, ?)")->execute([$ticket_id, $tag]);
        }

        echo json_encode(['success' => true]);
        break;"""),

    # get_tickets
    (r"    case 'get_tickets':\s+.*?(?=\n    case ')",
     r"""    case 'get_tickets':
        $sqlite = getDb();
        $db = getData(); // Legacy
        $my_service = resolveCurrentServiceKey($db);
        $role = $_SESSION['user_role'] ?? '';

        $sql = "SELECT * FROM tickets";
        $params = [];
        if ($role !== 'super_admin') {
            $sql .= " WHERE to_service = ? OR from_service = ?";
            $params = [$my_service, $my_service];
        }
        $stmt = $sqlite->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch tags and comments for each
        foreach ($result as &$t) {
            $stmtTags = $sqlite->prepare("SELECT tag FROM ticket_tags WHERE ticket_id = ?");
            $stmtTags->execute([$t['id']]);
            $t['tags'] = $stmtTags->fetchAll(PDO::FETCH_COLUMN);
            
            $stmtComms = $sqlite->prepare("SELECT * FROM ticket_comments WHERE ticket_id = ?");
            $stmtComms->execute([$t['id']]);
            $t['comments'] = $stmtComms->fetchAll(PDO::FETCH_ASSOC);
            $t['activities'] = []; // Activities could be fetched similarly if normalized, kept empty for brevity
        }

        echo json_encode(['success' => true, 'tickets' => $result]);
        break;"""),

    # update_ticket_status
    (r"    case 'update_ticket_status':\s+.*?(?=\n    case ')",
     r"""    case 'update_ticket_status':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $status = trim($data['status'] ?? '');
        
        $stmt = $sqlite->prepare("UPDATE tickets SET status = ? WHERE id = ?");
        $stmt->execute([$status, $ticket_id]);
        $found = $stmt->rowCount() > 0;
        
        echo json_encode(['success' => $found]);
        break;"""),
        
    # assign_ticket
    (r"    case 'assign_ticket':\s+.*?(?=\n    case ')",
     r"""    case 'assign_ticket':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $assigned_to = trim($data['assigned_to'] ?? '');
        $assigned_name = trim($data['assigned_name'] ?? '');

        $stmt = $sqlite->prepare("UPDATE tickets SET assigned_to = ?, assigned_name = ? WHERE id = ?");
        $stmt->execute([$assigned_to, $assigned_name, $ticket_id]);
        $found = $stmt->rowCount() > 0;

        echo json_encode(['success' => $found]);
        break;"""),
        
    # add_ticket_comment
    (r"    case 'add_ticket_comment':\s+.*?(?=\n    case ')",
     r"""    case 'add_ticket_comment':
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
        $stmt->execute(['tc_'.time().'_'.rand(100,999), $ticket_id, $user_name, $email, $comment]);

        echo json_encode(['success' => true]);
        break;""")
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('api.php', 'w', encoding='utf-8') as f:
    f.write(content)

print("Automated replacement complete for ticket and reaction endpoints.")
