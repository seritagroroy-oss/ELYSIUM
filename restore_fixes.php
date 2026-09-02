<?php
$f = 'backend/core/functions.php';
$content = file_get_contents($f);

// On va extraire manuellement les modifications
$chunks = [
    [
        'target' => "                    if (\$is244872 && \$totalRuptureBackend > 0 && !\$has_mutation_in) {\n                        \$totalRealWorkedUnits = 0;\n                        foreach (\$dates as \$d_check) {\n                            if ((\$att_map['J'][\$d_check] ?? '') === '1') \$totalRealWorkedUnits++;\n                            if ((\$att_map['N'][\$d_check] ?? '') === '1') \$totalRealWorkedUnits++;\n                        }\n                        // Ajuster pour combler l'écart par rapport à 30\n                        \$absences = max(0, 30 - \$totalRealWorkedUnits);\n                        // On remet les compteurs de rupture à 0 pour éviter la double retenue\n                        \$entrant_sortant_count = 0;\n                        \$entrant_count = 0;\n                    }",
        'replace' => "                    // Suppression de l'ancienne règle 24h qui forçait les absences et annulait les statuts entrant/sortant."
    ],
    [
        'target' => "                    \$is_both_entrant_and_exit = (\$entrant_count > 0 && \$totalRuptureBackend > 0);\n                    if (\$is_both_entrant_and_exit) {\n                        \$real_worked_days = 0;\n                        foreach (\$dates as \$d_check) {\n                            \$sJ_c = \$att_map['J'][\$d_check] ?? '';\n                            \$sN_c = \$att_map['N'][\$d_check] ?? '';\n                            if (\$sJ_c === '1' || \$sJ_c === 'R' || \$sJ_c === 'COST' || (is_string(\$sJ_c) && strpos(\$sJ_c, 'F_') === 0)) \$real_worked_days++;\n                            if (\$sN_c === '1' || \$sN_c === 'R' || \$sN_c === 'COST' || (is_string(\$sN_c) && strpos(\$sN_c, 'F_') === 0)) \$real_worked_days++;\n                        }\n\n                        \$real_absences_during_contract = 0;\n                        foreach (\$dates as \$d_check) {\n                            \$sJ_c = \$att_map['J'][\$d_check] ?? '';\n                            \$sN_c = \$att_map['N'][\$d_check] ?? '';\n                            if (\$sJ_c === 'A' || (\$sJ_c === 'M' && !\$include_m)) \$real_absences_during_contract++;\n                            if (\$sN_c === 'A' || (\$sN_c === 'M' && !\$include_m)) \$real_absences_during_contract++;\n                        }\n                        \$absences = \$real_absences_during_contract;\n                    }",
        'replace' => "                    \$is_rupture = (\$entrant_count > 0 || \$totalRuptureBackend > 0);\n                    if (\$is_rupture) {\n                        \$real_worked_days = 0;\n                        foreach (\$dates as \$d_check) {\n                            \$sJ_c = \$att_map['J'][\$d_check] ?? '';\n                            \$sN_c = \$att_map['N'][\$d_check] ?? '';\n                            \n                            \$worked_j = (\$sJ_c === '1' || \$sJ_c === 'R' || \$sJ_c === 'COST' || (is_string(\$sJ_c) && strpos(\$sJ_c, 'F_') === 0));\n                            \$worked_n = (\$sN_c === '1' || \$sN_c === 'R' || \$sN_c === 'COST' || (is_string(\$sN_c) && strpos(\$sN_c, 'F_') === 0));\n                            \n                            if (\$is244872) {\n                                // Pour les agents 24h, on compte par colonne (jour calendaire)\n                                if (\$worked_j || \$worked_n) \$real_worked_days++;\n                            } else {\n                                if (\$worked_j) \$real_worked_days++;\n                                if (\$worked_n) \$real_worked_days++;\n                            }\n                        }\n\n                        \$real_absences_during_contract = 0;\n                        foreach (\$dates as \$d_check) {\n                            \$sJ_c = \$att_map['J'][\$d_check] ?? '';\n                            \$sN_c = \$att_map['N'][\$d_check] ?? '';\n                            if (\$sJ_c === 'A' || (\$sJ_c === 'M' && !\$include_m)) \$real_absences_during_contract++;\n                            if (\$sN_c === 'A' || (\$sN_c === 'M' && !\$include_m)) \$real_absences_during_contract++;\n                        }\n                        \$absences = \$real_absences_during_contract;\n                    }"
    ],
    [
        'target' => "                    if (\$is_both_entrant_and_exit) {\n                        \$assigned_days = \$real_worked_days;",
        'replace' => "                    if (\$is_rupture) {\n                        \$assigned_days = \$real_worked_days;"
    ],
    [
        'target' => "                        if (\$is_both_entrant_and_exit) {",
        'replace' => "                        if (\$is_rupture) {"
    ],
    [
        'target' => "                        // Calcul des déductions\n                        if (\$is_both_entrant_and_exit || \$is_special) {\n                            \$deductions = 0;",
        'replace' => "                        // Calcul des déductions\n                        if (\$is_rupture || \$is_special) {\n                            \$deductions = 0;"
    ],
    [
        'target' => "                            'days_worked' => \$is_both_entrant_and_exit ? \$real_worked_days : (\$is_special ? \$real_active : max(0, \$active_days - (\$absences + \$map_count + \$permission_count))),",
        'replace' => "                            'days_worked' => \$is_rupture ? \$real_worked_days : (\$is_special ? \$real_active : max(0, \$active_days - (\$absences + \$map_count + \$permission_count))),"
    ],
    [
        'target' => "                    foreach (\$dates as \$date) {",
        'replace' => "                    \$last_day = count(\$dates) > 0 ? \$dates[count(\$dates) - 1] : null;\n                    \$is_mutated_away_permanently = false;\n                    if (\$last_day) {\n                        \$last_J = \$att_map['J'][\$last_day] ?? '';\n                        \$last_N = \$att_map['N'][\$last_day] ?? '';\n                        if ((is_string(\$last_J) && strpos(\$last_J, 'M|') === 0) || (is_string(\$last_N) && strpos(\$last_N, 'M|') === 0)) {\n                            \$is_mutated_away_permanently = true;\n                        }\n                    }\n                    if (\$is_mutated_away_permanently) {\n                        continue; // Le site d'origine ne le paie plus du tout\n                    }\n                    \n                    foreach (\$dates as \$date) {"
    ],
    [
        'target' => "                        \$real_active = \$assigned_days - \$mutated_away_days;\n                    }",
        'replace' => "                        // Modification: On ne soustrait plus \$mutated_away_days pour que le site de destination paie les 30 jours complets\n                        \$real_active = \$assigned_days; \n                    }"
    ],
    [
        'target' => "                            } else {\n                                \$active_days = \$assigned_days === 0 ? 0 : (int) round(\$real_active * \$divisor / \$full_month_assigned_days);\n                                if (\$active_days > \$divisor) \$active_days = \$divisor;\n                            } else {\n                                \$prorata_base = (int) round(\$base * (\$real_active / \$full_month_assigned_days));\n                            }\n                        }\n                        \n                        \$base_used_for_deductions = \$prorata_base; // Pour les retenues et les primes\n                        \n                        // ENTRANT exclus des déductions : l'agent n'était pas encore en poste, ce n'est pas une absence\n                        if (\$is_both_entrant_and_exit || \$is_special) {",
        'replace' => "                            } else {\n                                \$active_days = \$assigned_days === 0 ? 0 : (int) round(\$real_active * \$divisor / \$full_month_assigned_days);\n                                if (\$active_days > \$divisor) \$active_days = \$divisor;\n                                \$prorata_base = (int) round(\$base * (\$real_active / \$full_month_assigned_days));\n                            }\n                        }\n                        \n                        // CORRECTION: Les retenues doivent toujours être calculées sur le salaire de base entier (30j), pas sur le prorata\n                        \$base_used_for_deductions = \$base;\n                        \n                        if (\$is_rupture || \$is_special) {"
    ]
];

\$changed = 0;
foreach (\$chunks as \$i => \$chunk) {
    if (strpos(\$content, \$chunk['target']) !== false) {
        \$content = str_replace(\$chunk['target'], \$chunk['replace'], \$content);
        echo 'Replaced chunk ' . \$i . "\n";
        \$changed++;
    } else {
        echo 'Failed to find chunk ' . \$i . "\n";
    }
}
file_put_contents(\$f, \$content);
echo "Total replaced: \$changed\n";
?>
