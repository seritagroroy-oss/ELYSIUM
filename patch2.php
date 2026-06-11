<?php
$file = 'e:\Pontage - VRAI - Copie\api.php';
$content = file_get_contents($file);

$search = "foreach (\$db['attendance'] as \$period_key => \$agents_data) {\r\n           if (isset(\$db['attendance'][\$period_key][\$agent_id])) {\r\n               unset(\$db['attendance'][\$period_key][\$agent_id]);\r\n           }\r\n       }";
$replace = "if (isset(\$db['attendance']) && is_array(\$db['attendance'])) {\r\n           foreach (\$db['attendance'] as \$period_key => \$agents_data) {\r\n               if (isset(\$db['attendance'][\$period_key][\$agent_id])) {\r\n                   unset(\$db['attendance'][\$period_key][\$agent_id]);\r\n               }\r\n           }\r\n       }";

$content = str_replace($search, $replace, $content);
$content = str_replace(str_replace("\r\n", "\n", $search), $replace, $content);
file_put_contents($file, $content);
echo "Patched api.php foreach\n";
