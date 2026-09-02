<?php
@mkdir(dirname(__DIR__) . '/sauvegard', 0777, true);
copy(dirname(__DIR__) . '/frontend/src/components/tables/DashboardTable.jsx', dirname(__DIR__) . '/sauvegard/DashboardTable.jsx');
copy(dirname(__DIR__) . '/frontend/src/components/Dashboard.jsx', dirname(__DIR__) . '/sauvegard/Dashboard.jsx');
echo "Sauvegarde terminee avec succes.";
?>
