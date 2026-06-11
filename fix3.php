<?php
$content = file_get_contents('api.php');
$lines = explode("\n", $content);

$start = -1;
for ($i = 0; $i < count($lines); $i++) {
    if (strpos($lines[$i], "\$stmtInsert->execute([\$agent_id, \$date_str, 'N', \$status_old, \$company_id, \$serviceKey, \$period]);") !== false) {
        $start = $i + 2;
        break;
    }
}

if ($start !== -1) {
    // Find the end of the broken block
    $end = -1;
    for ($i = $start; $i < count($lines); $i++) {
        if (trim($lines[$i]) === "\$cursor = strtotime('+1 day', \$cursor);") {
            $end = $i - 1;
            break;
        }
    }
    
    if ($end !== -1) {
        // Remove broken lines
        array_splice($lines, $start, $end - $start);
        
        $new_code = "                if (\$stype === 'Nuit') {
                    \$db['attendance'][\$period][\$new_agent_id]['N'][\$date_str] = '1';
                    \$stmtDelete->execute([\$new_agent_id, \$date_str, 'N']);
                    \$stmtInsert->execute([\$new_agent_id, \$date_str, 'N', '1', \$company_id, \$serviceKey, \$period]);
                } elseif (\$stype === 'Jour') {
                    \$db['attendance'][\$period][\$new_agent_id]['J'][\$date_str] = '1';
                    \$stmtDelete->execute([\$new_agent_id, \$date_str, 'J']);
                    \$stmtInsert->execute([\$new_agent_id, \$date_str, 'J', '1', \$company_id, \$serviceKey, \$period]);
                } else {
                    \$cycle = 1; \$work = 1;
                    if (\$stype === '24h') { \$cycle = 2; \$work = 1; }
                    elseif (\$stype === '48h') { \$cycle = 4; \$work = 2; }
                    elseif (\$stype === '72h') { \$cycle = 6; \$work = 3; }
                    
                    \$idx = array_search(\$date_str, \$datesList);
                    if (\$idx !== false) {
                        \$pos = \$idx % \$cycle;
                        \$val = (\$pos < \$work) ? '1' : 'R';
                        
                        \$db['attendance'][\$period][\$new_agent_id]['J'][\$date_str] = \$val;
                        \$db['attendance'][\$period][\$new_agent_id]['N'][\$date_str] = \$val;
                        \$stmtDelete->execute([\$new_agent_id, \$date_str, 'J']);
                        \$stmtInsert->execute([\$new_agent_id, \$date_str, 'J', \$val, \$company_id, \$serviceKey, \$period]);
                        \$stmtDelete->execute([\$new_agent_id, \$date_str, 'N']);
                        \$stmtInsert->execute([\$new_agent_id, \$date_str, 'N', \$val, \$company_id, \$serviceKey, \$period]);
                    }
                }
            }";
            
        array_splice($lines, $start, 0, explode("\n", $new_code));
        file_put_contents('api.php', implode("\n", $lines));
        echo "Fixed";
    } else {
        echo "End not found";
    }
} else {
    echo "Start not found";
}
