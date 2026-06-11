<?php
require 'backend/database.php';

// Ouvrir directement la DB SQLite pour ajouter les colonnes manquantes
$path = __DIR__ . '/backend/elysium.db';
$db = new SQLite3($path);
$db->enableExceptions(true);

echo "=== Correction des colonnes manquantes ===\n\n";

// Fonction helper pour ajouter une colonne si elle n'existe pas
function addColumnIfMissing(SQLite3 $db, string $table, string $column, string $definition): void {
    $cols = $db->query("PRAGMA table_info($table)");
    $existing = [];
    while ($row = $cols->fetchArray(SQLITE3_ASSOC)) {
        $existing[] = $row['name'];
    }
    if (!in_array($column, $existing)) {
        $db->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        echo "  ✅ $table.$column ajouté\n";
    } else {
        echo "  ✓  $table.$column existe déjà\n";
    }
}

// ─── TABLE tickets ────────────────────────────────────────────────────────────
echo "Table: tickets\n";
addColumnIfMissing($db, 'tickets', 'to_service',     'TEXT');
addColumnIfMissing($db, 'tickets', 'from_service',   'TEXT');
addColumnIfMissing($db, 'tickets', 'description',    'TEXT');
addColumnIfMissing($db, 'tickets', 'assigned_to',    'TEXT');
addColumnIfMissing($db, 'tickets', 'assigned_name',  'TEXT');
addColumnIfMissing($db, 'tickets', 'rating',         'INTEGER');
addColumnIfMissing($db, 'tickets', 'rating_comment', 'TEXT');
addColumnIfMissing($db, 'tickets', 'sla_hours',      'INTEGER DEFAULT 48');
addColumnIfMissing($db, 'tickets', 'resolved_at',    'DATETIME');
addColumnIfMissing($db, 'tickets', 'updated_at',     'DATETIME DEFAULT CURRENT_TIMESTAMP');

// ─── TABLE inter_service_messages ─────────────────────────────────────────────
echo "\nTable: inter_service_messages\n";
addColumnIfMissing($db, 'inter_service_messages', 'sender',          'TEXT');
addColumnIfMissing($db, 'inter_service_messages', 'attachment',      'TEXT');
addColumnIfMissing($db, 'inter_service_messages', 'attachment_name', 'TEXT');
addColumnIfMissing($db, 'inter_service_messages', 'reply_to',        'TEXT');
addColumnIfMissing($db, 'inter_service_messages', 'is_read',         'INTEGER DEFAULT 0');
addColumnIfMissing($db, 'inter_service_messages', 'is_pinned',       'INTEGER DEFAULT 0');

// ─── TABLE messages ───────────────────────────────────────────────────────────
echo "\nTable: messages\n";
addColumnIfMissing($db, 'messages', 'is_pinned', 'INTEGER DEFAULT 0');
addColumnIfMissing($db, 'messages', 'type',      'TEXT DEFAULT \'text\'');

// ─── TABLE agents ─────────────────────────────────────────────────────────────
echo "\nTable: agents\n";
addColumnIfMissing($db, 'agents', 'shift_offset',       'INTEGER DEFAULT 0');
addColumnIfMissing($db, 'agents', 'work_days',          'INTEGER DEFAULT 0');
addColumnIfMissing($db, 'agents', 'shift_cycle',        'TEXT');
addColumnIfMissing($db, 'agents', 'repos_day_of_week',  'INTEGER DEFAULT -1');
addColumnIfMissing($db, 'agents', 'repos_segments',     'TEXT DEFAULT \'[]\'');
addColumnIfMissing($db, 'agents', 'salary',             'INTEGER DEFAULT 0');
addColumnIfMissing($db, 'agents', 'has_cnps',           'INTEGER DEFAULT 0');
addColumnIfMissing($db, 'agents', 'bank_account',       'TEXT');
addColumnIfMissing($db, 'agents', 'notes',              'TEXT');

// ─── TABLE sites ─────────────────────────────────────────────────────────────
echo "\nTable: sites\n";
addColumnIfMissing($db, 'sites', 'icon', 'TEXT DEFAULT \'🏢\'');

// ─── TABLE subsites ──────────────────────────────────────────────────────────
echo "\nTable: subsites\n";
addColumnIfMissing($db, 'subsites', 'service_id', 'TEXT');
addColumnIfMissing($db, 'subsites', 'company_id', 'TEXT');

// ─── TABLE attendance ────────────────────────────────────────────────────────
echo "\nTable: attendance\n";
addColumnIfMissing($db, 'attendance', 'notes', 'TEXT');

// ─── TABLE archives ──────────────────────────────────────────────────────────
echo "\nTable: archives\n";
addColumnIfMissing($db, 'archives', 'type', 'TEXT DEFAULT \'pointage\'');

// ─── TABLE payments ──────────────────────────────────────────────────────────
echo "\nTable: payments\n";
addColumnIfMissing($db, 'payments', 'external_id', 'TEXT');
addColumnIfMissing($db, 'payments', 'meta',        'TEXT DEFAULT \'{}\'');
addColumnIfMissing($db, 'payments', 'updated_at',  'DATETIME DEFAULT CURRENT_TIMESTAMP');

echo "\n✅ Toutes les colonnes manquantes ont été ajoutées.\n";

// Vérifier les erreurs de la table tickets
echo "\n=== Vérification table tickets ===\n";
$cols = $db->query("PRAGMA table_info(tickets)");
while ($row = $cols->fetchArray(SQLITE3_ASSOC)) {
    echo "  {$row['name']} ({$row['type']})\n";
}

$db->close();
