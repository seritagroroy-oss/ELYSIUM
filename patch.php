<?php
$file = 'e:\Pontage - VRAI - Copie\api.php';
$content = file_get_contents($file);

// Patch delete_agent
$content = preg_replace("/case 'update_attendance':/", "case 'delete_agent':\r\n       \$agent_id = \$data['agent_id'] ?? '';\r\n       if (!\$agent_id) {\r\n           echo json_encode(['success' => false, 'message' => 'Agent invalide']);\r\n           break;\r\n       }\r\n       \$sqlite = getDb();\r\n       \$sqlite->prepare(\"DELETE FROM agents WHERE id = ?\")->execute([\$agent_id]);\r\n       \$sqlite->prepare(\"DELETE FROM attendance WHERE agent_id = ?\")->execute([\$agent_id]);\r\n       \r\n       \$serviceKey = resolveCurrentServiceKeySql();\r\n       \$db = getScopedData(\$serviceKey);\r\n       foreach (\$db['attendance'] as \$period_key => \$agents_data) {\r\n           if (isset(\$db['attendance'][\$period_key][\$agent_id])) {\r\n               unset(\$db['attendance'][\$period_key][\$agent_id]);\r\n           }\r\n       }\r\n       saveScopedData(\$db, \$serviceKey);\r\n       echo json_encode(['success' => true]);\r\n       break;\r\n\r\n    case 'update_attendance':", $content, 1);

// Patch shift_history
$content = preg_replace("/\\\$orig_agent\['shift_history'\] = json_encode\(\\\[\s*\\\['type' => \\\$new_shift_type, 'from' => \\\$start_date\\\]\s*\\\]\);/", "\$current_history = [];\r\n           if (!empty(\$orig_agent['shift_history'])) {\r\n               \$current_history = json_decode(\$orig_agent['shift_history'], true) ?: [];\r\n           }\r\n           if (empty(\$current_history)) {\r\n               \$current_history[] = ['type' => \$actual_orig_stype, 'from' => '1970-01-01'];\r\n           }\r\n           \$current_history[] = ['type' => \$new_shift_type, 'from' => \$start_date];\r\n           \$orig_agent['shift_history'] = json_encode(\$current_history);", $content, 1);

file_put_contents($file, $content);
echo "Patched api.php regex\n";
