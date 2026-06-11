import re

with open('api.php', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # delete_service_account
    (r"    case 'delete_service_account':\s+.*?(?=\n    case ')",
     r"""    case 'delete_service_account':
       if (($_SESSION['user_role'] ?? '') !== 'admin' && ($_SESSION['user_role'] ?? '') !== 'super_admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }

       $email = strtolower(trim((string) ($data['email'] ?? '')));
       if ($email === '' || $email === 'admin@gmail.com') {
           echo json_encode(['success' => false, 'message' => 'Compte non supprimable']);
            break;
        }

       $sqlite = getDb();
       $stmtCheck = $sqlite->prepare("SELECT 1 FROM users WHERE email = ?");
       $stmtCheck->execute([$email]);
       if (!$stmtCheck->fetch()) {
           echo json_encode(['success' => false, 'message' => 'Compte introuvable']);
            break;
        }

       $stmtDel = $sqlite->prepare("DELETE FROM users WHERE email = ?");
       $stmtDel->execute([$email]);
       echo json_encode(['success' => true]);
        break;"""),

    # get_services_list
    (r"    case 'get_services_list':\s+.*?(?=\n    case ')",
     r"""    case 'get_services_list':
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
        break;"""),
        
    # set_typing_status
    (r"    case 'set_typing_status':\s+.*?(?=\n    case ')",
     r"""    case 'set_typing_status':
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
        break;""")
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('api.php', 'w', encoding='utf-8') as f:
    f.write(content)

print("Automated replacement complete for remaining smaller endpoints.")
