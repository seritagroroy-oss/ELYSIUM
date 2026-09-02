<?php
copy(__DIR__ . '/backend/core/functions.php', __DIR__ . '/sauvegard/functions_backup_special_salary.php');
copy(__DIR__ . '/frontend/src/components/modals/PrintFicheModal.jsx', __DIR__ . '/sauvegard/PrintFicheModal_backup_special_salary.jsx');
echo "Backup successful";
