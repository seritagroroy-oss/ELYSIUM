<?php
/**
 * RESTAURATION AGENTS ITC/IFM - pcsecuritex (comp_cf66d02f)
 * Recrée les 57 agents ITC avec leur pointage d'août 2026
 * NE TOUCHE PAS aux autres agents
 */
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$company_id  = 'comp_cf66d02f';
$service_id  = 'svc_52f7a282';   // service principal de comp_cf66d02f (628 agents)
$period      = '2026-08';
$created_at  = date('Y-m-d H:i:s');

// Mapping zone → subsite_id
$zone_to_subsite = [
    'OTS'                    => 'itc_ots_compcf66d02f',
    'COSTUME Jour'           => 'itc_costume_compcf66d02f',
    'COSTUME NUIT '          => 'itc_costume_compcf66d02f',
    'TENUE REGULIERE  Jour'  => 'itc_tenue_compcf66d02f',
    'TENUE REGULIERE Nuit '  => 'itc_tenue_compcf66d02f',
    'AGENTS SPECIAUX P3'     => 'itc_as_compcf66d02f',
];

// Liste complète des 57 agents ITC
$itc_agents = [
    // OTS
    ['id'=>'6a47c7f119a46','name'=>'KOUADIO KEKELY SYLVAIN',          'zone'=>'OTS',                   'function'=>'OTS',  'shift_type'=>'Nuit'],
    ['id'=>'6a47c7b4ef6ec','name'=>"N'GUESSAN KOFFI GUY",             'zone'=>'OTS',                   'function'=>'OTS',  'shift_type'=>'Jour'],
    ['id'=>'6a47c55b69c5e','name'=>'NIAMIEN KOFFI ELOI',              'zone'=>'OTS',                   'function'=>'OTS',  'shift_type'=>'Jour'],
    // COSTUME Jour
    ['id'=>'6a47cbc2a8f72','name'=>'ANASSE YABA EDWIGE',              'zone'=>'COSTUME Jour',           'function'=>'Costume','shift_type'=>'Jour'],
    ['id'=>'6a47cc1685776','name'=>'COULIBALY PERISSANGUI MARIAM',    'zone'=>'COSTUME Jour',           'function'=>'Costume','shift_type'=>'Jour'],
    ['id'=>'6a47cc3d4973f','name'=>'DEGNY MAFFE  DENIS',              'zone'=>'COSTUME Jour',           'function'=>'Costume','shift_type'=>'Jour'],
    ['id'=>'6a47cc6ead7b2','name'=>'DJE JOUAME GERMAIN',              'zone'=>'COSTUME Jour',           'function'=>'Costume','shift_type'=>'Jour'],
    ['id'=>'6a47cc99976b1','name'=>'KOFFI YAO HONORE',                'zone'=>'COSTUME Jour',           'function'=>'Costume','shift_type'=>'Jour'],
    ['id'=>'6a47cd1c624cf','name'=>'TANON PATRICK  JEAN VIANNEY',     'zone'=>'COSTUME Jour',           'function'=>'Costume','shift_type'=>'Jour'],
    ['id'=>'6a47cd525ea5f','name'=>'YEHI DEROUX GIDE VALERE',         'zone'=>'COSTUME Jour',           'function'=>'Costume','shift_type'=>'Jour'],
    // COSTUME Nuit
    ['id'=>'6a47cdca09c32','name'=>'ADOU KOUAME VALENTIN',            'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47cdf45099f','name'=>'BOLLI ALLO HUGUES',               'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47ce40438ff','name'=>'DIABATE YAYA',                    'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47ce6b05e8a','name'=>'EBO ALBERIC HERMANN',             'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47d029a5de9','name'=>'GBEDJO AKOUANI   PAUL  FERNAND',  'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47ce9a91620','name'=>'GNAHOUA SERI ELOIS',              'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Jour'],
    ['id'=>'6a47d079b38a3','name'=>"N'DOUA TANO  JEAN-BAPTISTE",      'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47d0ad7ad4f','name'=>"N'GUESSAN KOUAKOU  THEOPHILE",    'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47d0e1374a7','name'=>'SIPO NANDJUI RICHARD',            'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47d2ab78f72','name'=>'TEHE BARTHELEMY',                 'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    ['id'=>'6a47d3b72d317','name'=>'YAO AMOIN LOIS EMMANUELLE',       'zone'=>'COSTUME NUIT ',          'function'=>'Costume','shift_type'=>'Nuit'],
    // TENUE REGULIERE Jour
    ['id'=>'6a47d89cadf1e','name'=>'ADRO HENRI MICHEL EPHREM',        'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47d8fa0ff80','name'=>'AHOUAKAN ALBERT  ATCHO',          'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47d80bac891','name'=>'AKOU CHAYE MIREILLE',             'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47d83957b4e','name'=>'AKPA ADAM  YOHANN MIDIDESS',      'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47d85c1ac8c','name'=>'ARIKO ARNOLD  KEVIN',             'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47da6e2982b','name'=>'BOTI BI BOLI MARC',               'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47d9634eaf7','name'=>'BOTTI BI GOULA AURELIEN',         'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47da9372525','name'=>'CHERIF MANIAMA',                  'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dacc27153','name'=>'DEIHOU  CHRISTIAN ALESE J',       'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47daedb3421','name'=>'DIOMANDE  ABDOULAYE',             'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47db1b8f5cb','name'=>'GONHI JEAN JOSELIN',              'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47db3da7514','name'=>'KOFFI KONAN JEAN-JACQUES',        'zone'=>'TENUE REGULIERE  Jour',  'function'=>'CP',    'shift_type'=>'Jour'],
    ['id'=>'6a47dba026985','name'=>'KOFFI KOUASSI  RAYMOND',          'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dc0ca33b0','name'=>'KONE DRAMANE',                    'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dbef037de','name'=>'KOUADIO KOUASSI THIERRY  PATERNE','zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dc3330e83','name'=>'MAZOU KOUASSI RODRIGUE',          'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dc6fc3ddf','name'=>'OULAI YAKE FRANCIS',              'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a5a3c8c6350e','name'=>'PEH  GNONSIAN FRANCK URIEL',      'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dcacc8bba','name'=>'SIA GUEISSON YANNICK',            'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dcce818d7','name'=>'TAH VIVIANE',                     'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dd07a0f9b','name'=>'TAHA GON PATERNE',                'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47dd629e31b','name'=>'YAO KOFFI FULGENCE',              'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    ['id'=>'6a47ddbf8cf23','name'=>'ZREGBA HERVE',                    'zone'=>'TENUE REGULIERE  Jour',  'function'=>'TR',    'shift_type'=>'Jour'],
    // TENUE REGULIERE Nuit
    ['id'=>'6a47de5588640','name'=>'ABDOURAHAMANE OUMAROU IB',        'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    ['id'=>'6a47de8016373','name'=>'GNABA KOUTOUAN ARISTIDE',         'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    ['id'=>'6a47dedbd82ce','name'=>'KOFFI YAO FRANCK',                'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    ['id'=>'6a47deb33da0c','name'=>'KOFFI YAO GERARD',                'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    ['id'=>'6a47df16ab1ed','name'=>'RAIMI  ABIBULAMI',                'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    ['id'=>'6a47df5e1d57e','name'=>"RIMON N'GOU MARCK",               'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    ['id'=>'6a47df7fde3ab','name'=>'SOUMAHORO MEDIA',                 'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    ['id'=>'6a47dfbe504a9','name'=>'TCHET BEKA  KARIM',               'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    ['id'=>'6a47dfddecb21','name'=>'TOURE ABOU JUNIOR',               'zone'=>'TENUE REGULIERE Nuit ',  'function'=>'TR',    'shift_type'=>'Nuit'],
    // AGENTS SPECIAUX P3
    ['id'=>'6a47e18a1173e','name'=>'BEHI BI DJAHOUE',                 'zone'=>'AGENTS SPECIAUX P3',     'function'=>'AS-P3', 'shift_type'=>'Nuit'],
    ['id'=>'6a47e0cf1a722','name'=>'DOUMBIA  HAMADOU',                'zone'=>'AGENTS SPECIAUX P3',     'function'=>'AS-P3', 'shift_type'=>'Jour'],
    ['id'=>'6a47e0871b16d','name'=>'GBESSOU  DJE BI BERNARD  KEVIN',  'zone'=>'AGENTS SPECIAUX P3',     'function'=>'AS-P3', 'shift_type'=>'Jour'],
    ['id'=>'6a47e16634252','name'=>'ZOKOLO GNAHORE',                  'zone'=>'AGENTS SPECIAUX P3',     'function'=>'AS-P3', 'shift_type'=>'Jour'],
];

// Dates du cycle d'août 2026 (21 juillet → 20 août)
function getAugustDates() {
    $dates = [];
    $start = new DateTime('2026-07-21');
    $end   = new DateTime('2026-08-20');
    for ($d = clone $start; $d <= $end; $d->modify('+1 day')) {
        $dates[] = $d->format('Y-m-d');
    }
    return $dates;
}
$august_dates = getAugustDates();

// Préparer les requêtes
$stmtCheckAgent = $sqlite->prepare("SELECT id FROM agents WHERE id = ?");
$stmtInsertAgent = $sqlite->prepare("
    INSERT INTO agents (id, name, `function`, shift_type, subsite_id, service_id, company_id, archived_period, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
");
$stmtCheckAtt = $sqlite->prepare("SELECT id FROM attendance WHERE agent_id = ? AND period = ? LIMIT 1");
$stmtInsertAtt = $sqlite->prepare("
    INSERT IGNORE INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");

$agents_created   = 0;
$agents_skipped   = 0;
$attendance_added = 0;
$errors           = [];

foreach ($itc_agents as $ag) {
    $agent_id   = $ag['id'];
    $subsite_id = $zone_to_subsite[$ag['zone']] ?? null;

    if (!$subsite_id) {
        $errors[] = "Zone inconnue pour {$ag['name']}: {$ag['zone']}";
        continue;
    }

    // ── 1. Créer l'agent s'il n'existe pas déjà ─────────────────────────
    $stmtCheckAgent->execute([$agent_id]);
    $existing = $stmtCheckAgent->fetch();

    if (!$existing) {
        $stmtInsertAgent->execute([
            $agent_id,
            trim($ag['name']),
            $ag['function'],
            $ag['shift_type'],
            $subsite_id,
            $service_id,
            $company_id,
            $created_at,
        ]);
        $agents_created++;
        echo "✅ Agent créé : " . trim($ag['name']) . " → $subsite_id ({$ag['shift_type']})\n";
    } else {
        $agents_skipped++;
        echo "⏭️  Agent déjà présent : " . trim($ag['name']) . " (ID: $agent_id)\n";
        // S'assurer que l'agent est actif (archived_period NULL) et dans le bon subsite
        $sqlite->prepare("UPDATE agents SET archived_period = NULL, subsite_id = ?, service_id = ? WHERE id = ?")
               ->execute([$subsite_id, $service_id, $agent_id]);
    }

    // ── 2. Créer le pointage d'août 2026 s'il n'existe pas ───────────────
    $stmtCheckAtt->execute([$agent_id, $period]);
    $attExists = $stmtCheckAtt->fetch();

    if (!$attExists) {
        $shift_type_lower = strtolower($ag['shift_type']);
        $shift_code = ($shift_type_lower === 'nuit') ? 'N' : 'J';

        foreach ($august_dates as $date) {
            $dow = (int)(new DateTime($date))->format('w'); // 0=Dim
            $status = ($dow === 0) ? 'R' : '1'; // Repos le dimanche
            $stmtInsertAtt->execute([
                $agent_id, $date, $shift_code, $status,
                $company_id, $service_id, $period
            ]);
            $attendance_added++;
        }
    }
}

echo "\n\n========================================\n";
echo "✅ RESTAURATION TERMINÉE\n";
echo "Agents créés     : $agents_created\n";
echo "Agents réactivés : $agents_skipped\n";
echo "Pointages créés  : $attendance_added\n";

if (!empty($errors)) {
    echo "\n❌ ERREURS :\n";
    foreach ($errors as $e) echo "  - $e\n";
}
