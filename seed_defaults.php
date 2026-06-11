<?php
require 'backend/database.php';
$db = getDb();
$c = 'comp_default_1';
$db->exec("INSERT OR IGNORE INTO salary_grid(company_id, poste, taux_horaire) VALUES ('$c','AS',75000), ('$c','Chef de Poste',90000), ('$c','Garde Armé',120000)");
$db->exec("INSERT OR IGNORE INTO site_contracts(company_id, site_name, budget_mensuel) SELECT DISTINCT company_id, name, 0 FROM sites");
echo 'Seeded defaults';
