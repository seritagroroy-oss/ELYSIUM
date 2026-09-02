<?php
@mkdir(__DIR__ . '/sauvegard', 0777, true);
copy(__DIR__ . '/frontend/src/components/tables/DashboardTable.jsx', __DIR__ . '/sauvegard/DashboardTable.jsx');
copy(__DIR__ . '/frontend/src/components/Dashboard.jsx', __DIR__ . '/sauvegard/Dashboard.jsx');
echo "Sauvegarde terminée";
?>
