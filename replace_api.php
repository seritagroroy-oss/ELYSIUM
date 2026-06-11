<?php
$content = file_get_contents('api.php');

$replacements = [
// admin_create_account
"        \$db = getData();
        if (isset(\$db['users'][\$email])) {
            echo json_encode(['success' => false, 'message' => 'Cet email existe déjà']);
            break;
        }
        
        // If super_admin creates a user, we might need a company_id from input, but for now fallback
        \$target_company_id = \$creator_role === 'admin' ? \$creator_company_id : (\$data['company_id'] ?? 'comp_default_1');

        // Generate service ID based on name if not exists
        \$service_id = 'svc_' . substr(md5(\$service_name . microtime(true)), 0, 8);
        \$found_service_id = false;
        if (isset(\$db['services'])) {
            foreach (\$db['services'] as \$svc) {
                if (strtolower(trim(\$svc['name'])) === strtolower(\$service_name) && (\$svc['company_id'] ?? '') === \$target_company_id) {
                    \$service_id = \$svc['id'];
                    \$found_service_id = true;
                    break;
                }
            }
        }
        
        if (!\$found_service_id) {
            \$db['services'][] = [
                'id' => \$service_id,
                'name' => \$service_name,
                'company_id' => \$target_company_id,
                'permissions' => getDefaultServicePermissions()
            ];
        }

        \$role_display_name = 'Agent';
        if (\$role === 'super_admin') \$role_display_name = 'Directeur Général';
        elseif (\$role === 'admin') \$role_display_name = 'Propriétaire';

        \$permissions = \$data['permissions'] ?? [];
        if (!is_array(\$permissions)) {
            \$permissions = [];
        }

        \$db['users'][\$email] = [
            'password' => password_hash(\$password, PASSWORD_DEFAULT),
            'name' => \$name,
            'role' => \$role,
            'role_display_name' => \$role_display_name,
            'service' => \$service_name,
            'service_id' => \$service_id,
            'company_id' => \$target_company_id,
            'permissions' => \$permissions,
            'created_at' => date('c')
        ];

        ensureUserSubscriptionData(\$db['users'][\$email]);
        saveData(\$db);
        
        echo json_encode(['success' => true]);
        break;" => "        \$sqlite = getDb();
        \$stmt = \$sqlite->prepare(\"SELECT 1 FROM users WHERE email = ?\");
        \$stmt->execute([\$email]);
        if (\$stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Cet email existe déjà']);
            break;
        }

        \$target_company_id = \$creator_role === 'admin' ? \$creator_company_id : (\$data['company_id'] ?? 'comp_default_1');

        \$stmt = \$sqlite->prepare(\"SELECT id FROM services WHERE LOWER(TRIM(name)) = ? AND company_id = ?\");
        \$stmt->execute([strtolower(trim(\$service_name)), \$target_company_id]);
        \$svc = \$stmt->fetch();
        if (\$svc) {
            \$service_id = \$svc['id'];
        } else {
            \$service_id = 'svc_' . substr(md5(\$service_name . microtime(true)), 0, 8);
            \$stmt = \$sqlite->prepare(\"INSERT INTO services (id, name, company_id, permissions) VALUES (?, ?, ?, ?)\");
            \$stmt->execute([\$service_id, \$service_name, \$target_company_id, json_encode(getDefaultServicePermissions())]);
        }

        \$role_display_name = 'Agent';
        if (\$role === 'super_admin') \$role_display_name = 'Directeur Général';
        elseif (\$role === 'admin') \$role_display_name = 'Propriétaire';

        \$permissions = is_array(\$data['permissions'] ?? null) ? \$data['permissions'] : [];

        \$stmt = \$sqlite->prepare(\"INSERT INTO users (email, password, name, role, role_display_name, service, service_id, company_id, permissions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\");
        \$stmt->execute([
            \$email,
            password_hash(\$password, PASSWORD_DEFAULT),
            \$name,
            \$role,
            \$role_display_name,
            \$service_name,
            \$service_id,
            \$target_company_id,
            json_encode(\$permissions),
            date('Y-m-d H:i:s')
        ]);
        
        echo json_encode(['success' => true]);
        break;"
];

foreach ($replacements as $old => $new) {
    $content = str_replace($old, $new, $content);
}
file_put_contents('api.php', $content);
echo "Replaced some code.\n";
