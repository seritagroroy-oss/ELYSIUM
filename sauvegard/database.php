<?php
/**
 * database.php — Couche SQLite3 pour ELYSIUM
 * Utilise l'extension SQLite3 native de PHP (pdo_sqlite non requis).
 * Compatible PHP 8+ avec sqlite3 intégré.
 */

define('SQLITE_FILE', __DIR__ . '/elysium.db');

/**
 * Wrapper léger autour de SQLite3 ou PDO (MySQL) pour reproduire l'API
 * (prepare/execute/fetch) utilisée dans le reste du code.
 */
class ElysiumPdoDb
{
    private PDO $db;

    public function __construct(string $dsn, string $user = '', string $pass = '')
    {
        $this->db = new PDO($dsn, $user, $pass);
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }

    public function exec(string $sql): void
    {
        $this->db->exec($sql);
    }

    public function prepare(string $sql): ElysiumPdoStmt
    {
        $stmt = $this->db->prepare($sql);
        return new ElysiumPdoStmt($this->db, $stmt, $sql);
    }

    public function query(string $sql): array
    {
        $stmt = $this->db->query($sql);
        return $stmt ? $stmt->fetchAll() : [];
    }

    public function querySingle(string $sql): ?array
    {
        $rows = $this->query($sql);
        return $rows[0] ?? null;
    }

    public function lastInsertId(): int
    {
        return (int)$this->db->lastInsertId();
    }

    public function beginTransaction(): bool
    {
        return $this->db->beginTransaction();
    }

    public function commit(): bool
    {
        return $this->db->commit();
    }

    public function rollBack(): bool
    {
        return $this->db->rollBack();
    }

    public function inTransaction(): bool
    {
        return $this->db->inTransaction();
    }
}

class ElysiumPdoStmt
{
    private PDO $db;
    private PDOStatement $stmt;
    private string $sql;

    public function __construct(PDO $db, PDOStatement $stmt, string $sql)
    {
        $this->db   = $db;
        $this->stmt = $stmt;
        $this->sql  = $sql;
    }

    public function execute(array $params = []): bool
    {
        // Nettoyage des index : PDO execute avec '?' attend un tableau standard (0-indexed)
        return $this->stmt->execute(array_values($params));
    }

    public function fetch($mode = null, $cursorOrientation = PDO::FETCH_ORI_NEXT, $cursorOffset = 0)
    {
        $res = $mode !== null ? $this->stmt->fetch($mode, $cursorOrientation, $cursorOffset) : $this->stmt->fetch();
        return $res ?: null;
    }

    public function fetchAll($mode = null, ...$args)
    {
        return $mode !== null ? $this->stmt->fetchAll($mode, ...$args) : $this->stmt->fetchAll();
    }

    public function fetchColumn(int $column = 0)
    {
        return $this->stmt->fetchColumn($column);
    }

    public function rowCount(): int
    {
        return $this->stmt->rowCount();
    }
}

class ElysiumDb
{
    private SQLite3 $db;

    public function __construct(string $path)
    {
        $this->db = new SQLite3($path);
        $this->db->enableExceptions(true);
        $this->db->exec('PRAGMA journal_mode=WAL');
        $this->db->exec('PRAGMA foreign_keys=ON');
        $this->db->exec('PRAGMA synchronous=NORMAL');
    }

    public function exec(string $sql): void
    {
        $this->db->exec($sql);
    }

    public function prepare(string $sql): ElysiumStmt
    {
        $stmt = $this->db->prepare($sql);
        return new ElysiumStmt($this->db, $stmt, $sql);
    }

    public function query(string $sql): array
    {
        $result = $this->db->query($sql);
        $rows = [];
        if ($result) {
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $rows[] = $row;
            }
        }
        return $rows;
    }

    public function querySingle(string $sql): ?array
    {
        $rows = $this->query($sql);
        return $rows[0] ?? null;
    }

    public function lastInsertId(): int
    {
        return (int)$this->db->lastInsertRowID();
    }

    public function beginTransaction(): void
    {
        $this->db->exec('BEGIN TRANSACTION');
    }

    public function commit(): void
    {
        $this->db->exec('COMMIT');
    }

    public function rollBack(): void
    {
        $this->db->exec('ROLLBACK');
    }

    public function inTransaction(): bool
    {
        // Approximation basique pour SQLite3
        return false;
    }
}

class ElysiumStmt
{
    private SQLite3 $db;
    private SQLite3Stmt $stmt;
    private string $sql;
    private array $lastResult = [];

    public function __construct(SQLite3 $db, SQLite3Stmt $stmt, string $sql)
    {
        $this->db   = $db;
        $this->stmt = $stmt;
        $this->sql  = $sql;
    }

    public function execute(array $params = []): bool
    {
        $this->stmt->reset();
        $this->stmt->clear();
        foreach (array_values($params) as $i => $val) {
            $type = is_int($val) ? SQLITE3_INTEGER : (is_null($val) ? SQLITE3_NULL : SQLITE3_TEXT);
            $this->stmt->bindValue($i + 1, $val, $type);
        }
        $result = $this->stmt->execute();
        $this->lastResult = [];
        if ($result && $result->numColumns() > 0) {
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $this->lastResult[] = $row;
            }
        }
        return true;
    }

    public function fetch(): ?array
    {
        return array_shift($this->lastResult);
    }

    public function fetchAll(): array
    {
        $all = $this->lastResult;
        $this->lastResult = [];
        return $all;
    }

    public function fetchColumn(int $column = 0)
    {
        $row = array_shift($this->lastResult);
        if ($row) {
            $values = array_values($row);
            return $values[$column] ?? false;
        }
        return false;
    }

    public function rowCount(): int
    {
        return $this->db->changes();
    }
}

function getDb()
{
    static $db = null;
    if ($db !== null) {
        return $db;
    }

    // Lecture simple du .env
    $envPath = __DIR__ . '/../.env';
    $env = [];
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $env[trim($k)] = trim($v);
            }
        }
    }

    $dbConnection = $env['DB_CONNECTION'] ?? 'sqlite';

    if ($dbConnection === 'mysql') {
        $host = $env['DB_HOST'] ?? '127.0.0.1';
        $port = $env['DB_PORT'] ?? '3306';
        $dbname = $env['DB_DATABASE'] ?? 'elysium';
        $user = $env['DB_USERNAME'] ?? 'root';
        $pass = $env['DB_PASSWORD'] ?? '';
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
        $db = new ElysiumPdoDb($dsn, $user, $pass);
        
        // Optimisation : Ne pas exécuter les lourdes requêtes DDL à chaque requête API (crée un goulet d'étranglement)
        $migration_flag = __DIR__ . '/mysql_migrated.flag';
        if (!file_exists($migration_flag)) {
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN statut_final VARCHAR(255) DEFAULT ''"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN motif_refus TEXT"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN services_cibles TEXT"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN agent_nom TEXT"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN agent_matricule TEXT"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN reclamation_categorie TEXT"); } catch (Exception $e) {}
            // Unified definition for archives_pointage table – MySQL only
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS archives_pointage (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    company_id VARCHAR(100),
                    period VARCHAR(20),
                    archived_date DATETIME,
                    archived_by VARCHAR(255),
                    data LONGTEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");
                // Indexes for faster queries
                $db->exec("CREATE INDEX IF NOT EXISTS idx_archives_pointage_company ON archives_pointage(company_id)");
                $db->exec("CREATE INDEX IF NOT EXISTS idx_archives_pointage_period ON archives_pointage(period)");
            } catch (Exception $e) {}
            // Migration: add columns if table existed before the unified schema
            try { $db->exec("ALTER TABLE archives_pointage ADD COLUMN archived_date DATETIME"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE archives_pointage ADD COLUMN archived_by VARCHAR(255)"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE archives_pointage ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE archives_pointage MODIFY COLUMN company_id VARCHAR(100)"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN jours_concernes TEXT"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN montant_estime TEXT"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN mois_concerne TEXT"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN statut TEXT DEFAULT 'En attente'"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE reclamations ADD COLUMN description TEXT"); } catch (Exception $e) {}

            try { $db->exec("ALTER TABLE attendance ADD INDEX idx_att_agent_period_date (agent_id, period, date)"); } catch (Exception $e) {}
            try { $db->exec("CREATE INDEX idx_attendance_period ON attendance (period)"); } catch (Exception $e) {}
            try { $db->exec("CREATE INDEX idx_attendance_agent_period ON attendance (agent_id, period)"); } catch (Exception $e) {}
            try { $db->exec("CREATE INDEX idx_agents_company ON agents (company_id)"); } catch (Exception $e) {}
            try { $db->exec("CREATE INDEX idx_agents_subsite ON agents (subsite_id)"); } catch (Exception $e) {}
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS treated_agents (
                    company_id VARCHAR(100),
                    service_id VARCHAR(100),
                    site_id VARCHAR(100),
                    period VARCHAR(30),
                    agent_id VARCHAR(100),
                    PRIMARY KEY (company_id, service_id, site_id, period, agent_id)
                )");
            } catch (Exception $e) {}
            
            // Migration: table calendar_progress
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS calendar_progress (
                    email VARCHAR(255), 
                    period VARCHAR(50), 
                    data TEXT, 
                    PRIMARY KEY(email, period)
                )");
            } catch (Exception $e) {}

            // Migration: table payroll_statuses pour persister les statuts de paie
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS payroll_statuses (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    company_id VARCHAR(100) NOT NULL,
                    period VARCHAR(7) NOT NULL,
                    site_id VARCHAR(100) NOT NULL DEFAULT '',
                    zone_name VARCHAR(255) NOT NULL DEFAULT '',
                    agent_name VARCHAR(255) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'brouillon',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_payroll_status (company_id, period, site_id, zone_name, agent_name)
                )");
            } catch (Exception $e) {}
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS payroll_snapshots (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    company_id VARCHAR(100) NOT NULL,
                    period VARCHAR(20) NOT NULL,
                    snapshot LONGTEXT NOT NULL,
                    published_by VARCHAR(255),
                    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_snapshot (company_id, period)
                )");
            } catch (Exception $e) {}
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS archives (
                    id VARCHAR(255) PRIMARY KEY,
                    service_id VARCHAR(100),
                    company_id VARCHAR(100),
                    period VARCHAR(20),
                    data LONGTEXT,
                    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    archived_by VARCHAR(255)
                )");
            } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE agent_loans ADD COLUMN agent_id VARCHAR(100)"); } catch (Exception $e) {}
            try { $db->exec("ALTER TABLE agent_loans ADD COLUMN already_paid INTEGER DEFAULT 0"); } catch (Exception $e) {}
            
            // Marquer la migration initiale comme effectuée
            @file_put_contents($migration_flag, date('Y-m-d H:i:s'));
        }
    } else {
        $db = new ElysiumDb(SQLITE_FILE);
    }

    if ($dbConnection !== 'mysql') {
        initSchema($db);
        try {
            $db->exec("ALTER TABLE sites ADD COLUMN source_module TEXT DEFAULT 'PC'");
        } catch (Exception $e) {
            // Ignorer l'erreur si la colonne existe déjà
        }
        // Ajout des colonnes manquantes dans tickets (migration safe)
        $ticketCols = [
            "ALTER TABLE tickets ADD COLUMN from_service TEXT",
            "ALTER TABLE tickets ADD COLUMN to_service TEXT",
            "ALTER TABLE tickets ADD COLUMN from_user TEXT",
            "ALTER TABLE tickets ADD COLUMN from_user_email TEXT",
            "ALTER TABLE tickets ADD COLUMN content TEXT",
            "ALTER TABLE tickets ADD COLUMN assigned_name TEXT",
            "ALTER TABLE contract_ruptures ADD COLUMN contract_rows TEXT",
            "ALTER TABLE contract_ruptures ADD COLUMN rupture_date TEXT",
            "ALTER TABLE contract_ruptures ADD COLUMN is_billed INTEGER DEFAULT 1",
            "ALTER TABLE subsites ADD COLUMN created_at TEXT",
            "ALTER TABLE agents ADD COLUMN status_change TEXT",
            "ALTER TABLE subsites ADD COLUMN costume_enabled INTEGER DEFAULT 0",
            "ALTER TABLE subsites ADD COLUMN enabled_functions TEXT DEFAULT '[]'",
            "ALTER TABLE subsites ADD COLUMN contract_end_date TEXT",
            "ALTER TABLE subsites ADD COLUMN contract_end_motif TEXT",
            "ALTER TABLE supplementaires_externes ADD COLUMN agent_remplace TEXT",
            "ALTER TABLE reclamations ADD COLUMN statut_final TEXT DEFAULT ''",
            "ALTER TABLE reclamations ADD COLUMN motif_refus TEXT DEFAULT ''",
            "ALTER TABLE reclamations ADD COLUMN services_cibles TEXT DEFAULT '[]'",
            "ALTER TABLE reclamations ADD COLUMN agent_nom TEXT",
            "ALTER TABLE reclamations ADD COLUMN agent_matricule TEXT",
            "ALTER TABLE reclamations ADD COLUMN reclamation_categorie TEXT",
            "ALTER TABLE reclamations ADD COLUMN jours_concernes TEXT",
            "ALTER TABLE reclamations ADD COLUMN montant_estime TEXT",
            "ALTER TABLE reclamations ADD COLUMN mois_concerne TEXT",
            "ALTER TABLE reclamations ADD COLUMN statut TEXT DEFAULT 'En attente'",
            "ALTER TABLE reclamations ADD COLUMN description TEXT"
        ];
        foreach ($ticketCols as $sql) {
            try { $db->exec($sql); } catch (Exception $e) { /* colonne déjà présente */ }
        }
        // Migration automatique des fichiers JSON vers SQLite (s'exécute une seule fois)
        autoMigrateJsonToSqlite($db);

        // Optimisation majeure de la BD : Création d'index pour accélérer considérablement get_dashboard_init
        try {
            $db->exec("CREATE INDEX IF NOT EXISTS idx_attendance_period ON attendance (period)");
            $db->exec("CREATE INDEX IF NOT EXISTS idx_attendance_agent_period ON attendance (agent_id, period)");
            $db->exec("CREATE INDEX IF NOT EXISTS idx_agents_company ON agents (company_id)");
            $db->exec("CREATE INDEX IF NOT EXISTS idx_agents_subsite ON agents (subsite_id)");
        } catch (Exception $e) {}
    }

    return $db;
}

/**
 * Migre automatiquement les données de agent_users.json et pointage_db.json
 * vers les tables SQLite correspondantes. Ne s'exécute qu'une seule fois grâce
 * à un flag dans service_data.
 */
function autoMigrateJsonToSqlite(ElysiumDb $db): void
{
    // Vérifie si la migration a déjà été faite
    try {
        $chkFlag = $db->prepare("SELECT value FROM service_data WHERE company_id='_system' AND data_key='json_migration_done'");
        $chkFlag->execute([]);
        if ($chkFlag->fetch()) return; // Déjà migré
    } catch (Exception $e) {
        return; // Table service_data pas encore créée, on reviendra
    }

    $root = dirname(__DIR__);

    // ─── 1. agent_users.json → agent_portal_users ───────────────
    $agentFile = $root . '/agent_users.json';
    if (file_exists($agentFile)) {
        $users = json_decode(@file_get_contents($agentFile), true);
        if (is_array($users)) {
            foreach ($users as $u) {
                $agent_id = $u['agent_id'] ?? '';
                if (!$agent_id) continue;
                try {
                    $chk = $db->prepare('SELECT id FROM agent_portal_users WHERE agent_id = ?');
                    $chk->execute([$agent_id]);
                    if ($chk->fetch()) continue;
                    $db->prepare('
                        INSERT INTO agent_portal_users (id, service_id, agent_id, name, matricule, phone, dob, pin, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ')->execute([
                        $u['id'] ?? ('u_' . time() . '_' . rand(100, 999)),
                        $u['service_id'] ?? '',
                        $agent_id,
                        $u['name'] ?? '',
                        $u['matricule'] ?? $agent_id,
                        $u['phone'] ?? '',
                        $u['dob'] ?? '',
                        $u['pin'] ?? '',
                        $u['status'] ?? 'pending',
                        $u['created_at'] ?? date('Y-m-d H:i:s'),
                    ]);
                } catch (Exception $e) { /* silencieux */ }
            }
        }
    }

    // ─── 2. pointage_db.json → reclamations ─────────────────────
    $recFile = $root . '/pointage_db.json';
    if (file_exists($recFile)) {
        $dbData = json_decode(@file_get_contents($recFile), true);
        $recs = $dbData['reclamations'] ?? [];
        foreach ($recs as $r) {
            $id = $r['id'] ?? '';
            if (!$id) $id = 'rec_' . time() . '_' . rand(1000, 9999);
            try {
                $chk = $db->prepare('SELECT id FROM reclamations WHERE id = ?');
                $chk->execute([$id]);
                if ($chk->fetch()) continue;
                $db->prepare('
                    INSERT INTO reclamations (
                        id, company_id, service_declarant, agent_nom, agent_matricule, agent_site,
                        agent_fonction, date_entree, reclamation_categorie, reclamation_categorie_autre,
                        categorie, declarant_nom, declarant_prenom, declarant_matricule, declarant_fonction,
                        declarant_service, type_erreur, type_erreur_autre, mois_concerne, jours_concernes,
                        premiere_reclamation, ponction_precedente_correcte, montant_estime, action_demandee,
                        description, radio_code, radio_signature, statut, avis_secretariat, avis_comptabilite, created_at
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ')->execute([
                    $id, 'comp_default_1',
                    $r['service_declarant'] ?? '', $r['agent_nom'] ?? '', $r['agent_matricule'] ?? '',
                    $r['agent_site'] ?? '', $r['agent_fonction'] ?? '', $r['date_entree'] ?? '',
                    $r['reclamation_categorie'] ?? 'Salaire', $r['reclamation_categorie_autre'] ?? '',
                    $r['categorie'] ?? 'DIVERS', $r['declarant_nom'] ?? '', $r['declarant_prenom'] ?? '',
                    $r['declarant_matricule'] ?? '', $r['declarant_fonction'] ?? '', $r['declarant_service'] ?? '',
                    $r['type_erreur'] ?? '', $r['type_erreur_autre'] ?? '', $r['mois_concerne'] ?? '',
                    $r['jours_concernes'] ?? '', $r['premiere_reclamation'] ?? 'Oui',
                    $r['ponction_precedente_correcte'] ?? 'Non', (float)($r['montant_estime'] ?? 0),
                    $r['action_demandee'] ?? '', $r['description'] ?? '', $r['radio_code'] ?? '',
                    $r['radio_signature'] ?? '', $r['statut'] ?? 'En attente',
                    $r['avis_secretariat'] ?? '', $r['avis_comptabilite'] ?? '',
                    $r['created_at'] ?? date('Y-m-d H:i:s'),
                ]);
            } catch (Exception $e) { /* silencieux */ }
        }
    }

    // Marque la migration comme terminée
    try {
        $db->prepare("INSERT OR REPLACE INTO service_data (company_id, data_key, value) VALUES ('_system','json_migration_done',?)")
           ->execute([date('Y-m-d H:i:s')]);
    } catch (Exception $e) { /* silencieux */ }
}


function initSchema(ElysiumDb $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS entreprises (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            logo_url    TEXT,
            plan        TEXT DEFAULT 'trial',
            settings    TEXT DEFAULT '{}',
            owner_email TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password            TEXT NOT NULL,
            name                TEXT,
            role                TEXT DEFAULT 'user',
            role_display_name   TEXT,
            service             TEXT,
            service_id          TEXT,
            workspace_type      TEXT DEFAULT 'AUTRE',
            phone               TEXT,
            profile_photo       TEXT,
            company_id          TEXT DEFAULT 'comp_default_1',
            permissions         TEXT DEFAULT '{}',
            settings            TEXT DEFAULT '{}',
            status              TEXT DEFAULT 'active',
            maintenance_mode    INTEGER DEFAULT 0,
            trial_started_at    DATETIME,
            trial_ends_at       DATETIME,
            subscription_until  DATETIME,
            subscription_plan   TEXT DEFAULT 'premium_monthly',
            subscription_price  INTEGER DEFAULT 20000,
            subscription_currency TEXT DEFAULT 'XOF',
            last_activity       DATETIME,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES entreprises(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS agent_adjustments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT,
            type TEXT,
            amount REAL,
            motif TEXT,
            period TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS agent_sanctions (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            type_sanction TEXT NOT NULL,
            motif TEXT NOT NULL,
            date_sanction TEXT NOT NULL,
            date_fin_mise_a_pied TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            company_id TEXT,
            service_id TEXT
        );

        CREATE TABLE IF NOT EXISTS agent_long_absences (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            type_absence TEXT NOT NULL,
            date_debut TEXT NOT NULL,
            date_fin_prevue TEXT,
            date_reprise TEXT,
            statut_justificatif TEXT,
            file_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            company_id TEXT,
            service_id TEXT
        );

        CREATE TABLE IF NOT EXISTS agent_mutations (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            ancien_site_id TEXT,
            nouveau_site_id TEXT,
            date_mutation TEXT NOT NULL,
            motif TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            company_id TEXT,
            service_id TEXT
        );

        CREATE TABLE IF NOT EXISTS private_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_email TEXT NOT NULL,
            receiver_email TEXT NOT NULL,
            message TEXT,
            file_url TEXT,
            file_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            company_id TEXT DEFAULT 'comp_default_1'
        );

        CREATE TABLE IF NOT EXISTS message_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            is_announcement INTEGER DEFAULT 0,
            company_id TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS message_group_members (
            group_id TEXT NOT NULL,
            user_email TEXT NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(group_id, user_email)
        );

        CREATE TABLE IF NOT EXISTS group_messages (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            content TEXT,
            attachment TEXT,
            attachment_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_statuses (
            id TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            company_id TEXT NOT NULL,
            content_type TEXT DEFAULT 'text',
            content TEXT NOT NULL,
            bg_color TEXT DEFAULT '#075e54',
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS active_calls (
            id TEXT PRIMARY KEY,
            caller_email TEXT NOT NULL,
            receiver_email TEXT NOT NULL,
            room_name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ringing',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS status_views (
            status_id TEXT NOT NULL,
            viewer_email TEXT NOT NULL,
            viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(status_id, viewer_email)
        );

        CREATE TABLE IF NOT EXISTS services (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            company_id  TEXT,
            permissions TEXT DEFAULT '{}',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES entreprises(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sites (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            service_id  TEXT,
            company_id  TEXT,
            source_module TEXT DEFAULT 'PC',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS subsites (
            id      TEXT PRIMARY KEY,
            name    TEXT NOT NULL,
            site_id TEXT NOT NULL,
            costume_enabled INTEGER DEFAULT 0,
            enabled_functions TEXT DEFAULT '[]',
            contract_end_date TEXT,
            contract_end_motif TEXT,
            contract_end_updated_at DATETIME,
            closure_notified INTEGER DEFAULT 0,
            closure_last_reminder_at DATETIME,
            FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS agents (
            id              TEXT PRIMARY KEY,
            name            TEXT NOT NULL,
            function        TEXT,
            shift_type      TEXT,
            has_sp          INTEGER DEFAULT 0,
            hire_date       TEXT,
            exit_date       TEXT,
            exit_reason     TEXT,
            archived_period TEXT,
            recruitment_cost INTEGER DEFAULT 0,
            subsite_id      TEXT,
            service_id      TEXT,
            company_id      TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            shift_offset    INTEGER,
            work_days       INTEGER,
            shift_cycle     TEXT,
            repos_day_of_week INTEGER,
            repos_segments  TEXT,
            salary          INTEGER,
            has_cnps        INTEGER,
            bank_account    TEXT,
            notes           TEXT,
            shift_history   TEXT,
            contract_end_date TEXT,
            is_blacklisted  INTEGER DEFAULT 0,
            status_change   TEXT
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id    TEXT NOT NULL,
            date        TEXT NOT NULL,
            shift_code  TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT '1',
            service_id  TEXT,
            company_id  TEXT,
            period      TEXT,
            UNIQUE(agent_id, date, shift_code)
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            description TEXT,
            status      TEXT DEFAULT 'open',
            priority    TEXT DEFAULT 'medium',
            created_by  TEXT,
            assigned_to TEXT,
            service_id  TEXT,
            company_id  TEXT,
            tags        TEXT DEFAULT '[]',
            rating      INTEGER,
            rating_comment TEXT,
            sla_hours   INTEGER DEFAULT 48,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id   TEXT,
            sender      TEXT NOT NULL,
            content     TEXT NOT NULL,
            is_pinned   INTEGER DEFAULT 0,
            service_id  TEXT,
            company_id  TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS login_attempts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ip          TEXT NOT NULL,
            email       TEXT,
            success     INTEGER DEFAULT 0,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
            id          TEXT PRIMARY KEY,
            user_email  TEXT,
            amount      INTEGER,
            currency    TEXT DEFAULT 'XOF',
            provider    TEXT,
            external_id TEXT,
            status      TEXT DEFAULT 'pending',
            meta        TEXT DEFAULT '{}',
            company_id  TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS archives (
            id          TEXT PRIMARY KEY,
            service_id  TEXT,
            company_id  TEXT,
            period      TEXT,
            data        TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS archives_pointage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT,
            period TEXT,
            archived_date DATETIME,
            archived_by TEXT,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS salary_config (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id  TEXT,
            company_id  TEXT,
            config_key  TEXT,
            config_val  TEXT,
            UNIQUE(service_id, config_key)
        );

        CREATE TABLE IF NOT EXISTS service_data (
            service_id  TEXT,
            data_key    TEXT,
            data_value  TEXT,
            PRIMARY KEY(service_id, data_key)
        );

        CREATE TABLE IF NOT EXISTS inter_service_messages (
            id              TEXT PRIMARY KEY,
            from_service    TEXT NOT NULL,
            to_service      TEXT NOT NULL,
            sender          TEXT NOT NULL,
            content         TEXT,
            attachment      TEXT,
            attachment_name TEXT,
            reply_to        TEXT,
            is_pinned       INTEGER DEFAULT 0,
            company_id      TEXT DEFAULT 'comp_default_1',
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS typing_states (
            from_service    TEXT NOT NULL,
            to_service      TEXT NOT NULL,
            user_email      TEXT NOT NULL,
            timestamp       INTEGER NOT NULL,
            PRIMARY KEY(from_service, to_service, user_email)
        );

        CREATE TABLE IF NOT EXISTS message_reactions (
            message_id      TEXT NOT NULL,
            emoji           TEXT NOT NULL,
            user_email      TEXT NOT NULL,
            user_name       TEXT NOT NULL,
            PRIMARY KEY(message_id, emoji, user_email)
        );

        CREATE TABLE IF NOT EXISTS ticket_comments (
            id              TEXT PRIMARY KEY,
            ticket_id       TEXT NOT NULL,
            user_name       TEXT NOT NULL,
            user_email      TEXT NOT NULL,
            content         TEXT NOT NULL,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ticket_tags (
            ticket_id       TEXT NOT NULL,
            tag             TEXT NOT NULL,
            PRIMARY KEY(ticket_id, tag)
        );

        CREATE INDEX IF NOT EXISTS idx_attendance_agent_date ON attendance(agent_id, date);
        CREATE INDEX IF NOT EXISTS idx_attendance_service ON attendance(service_id, period);
        CREATE INDEX IF NOT EXISTS idx_attendance_agent_period ON attendance(agent_id, period);
        CREATE INDEX IF NOT EXISTS idx_attendance_period ON attendance(period);
        CREATE INDEX IF NOT EXISTS idx_messages_ticket ON messages(ticket_id);
        CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip, created_at);
        CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
        CREATE INDEX IF NOT EXISTS idx_agents_service ON agents(service_id);
        CREATE INDEX IF NOT EXISTS idx_agents_subsite_company ON agents(subsite_id, company_id);
        CREATE INDEX IF NOT EXISTS idx_ism_services ON inter_service_messages(from_service, to_service);
        CREATE INDEX IF NOT EXISTS idx_supp_ext_agent_period ON supplementaires_externes(agent_id, periode);
        CREATE INDEX IF NOT EXISTS idx_archives_company ON archives(company_id);
        CREATE INDEX IF NOT EXISTS idx_archives_service ON archives(service_id);

        /* TABLE POUR AGENTS RELEVE */
        CREATE TABLE IF NOT EXISTS agent_schedules (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id    TEXT NOT NULL,
            day_of_week INTEGER NOT NULL, /* 1=Lundi, 7=Dimanche */
            target_site_id TEXT,
            target_subsite_id TEXT,
            UNIQUE(agent_id, day_of_week)
        );
    ");

    /* Tenter d'ajouter metadata à attendance */
    try {
        $pdo->exec("ALTER TABLE companies ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    } catch(Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE subsites ADD COLUMN contract_end_updated_at DATETIME");
    } catch(Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE subsites ADD COLUMN closure_notified INTEGER DEFAULT 0");
    } catch(Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE subsites ADD COLUMN closure_last_reminder_at DATETIME");
    } catch(Exception $e) {}

    $pdo->exec("
        /* NOUVELLES TABLES POUR FLUCTUATION SALARIALE & BI */
        CREATE TABLE IF NOT EXISTS salary_grid (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id  TEXT,
            poste       TEXT NOT NULL,
            taux_horaire INTEGER DEFAULT 0,
            UNIQUE(company_id, poste)
        );

        CREATE TABLE IF NOT EXISTS site_contracts (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id      TEXT,
            site_name       TEXT NOT NULL,
            budget_mensuel  INTEGER DEFAULT 0,
            charges_percent REAL DEFAULT 0,
            frais_fixes     INTEGER DEFAULT 0,
            prime_site      INTEGER DEFAULT 0,
            prime_function  TEXT DEFAULT '',
            UNIQUE(company_id, site_name)
        );

        CREATE TABLE IF NOT EXISTS subsite_contracts (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id       TEXT NOT NULL,
            subsite_id       TEXT NOT NULL,
            fonction         TEXT NOT NULL,
            shift_type       TEXT DEFAULT 'Jour',
            quantite         INTEGER DEFAULT 1,
            montant_unitaire INTEGER DEFAULT 0,
            UNIQUE(company_id, subsite_id, fonction, shift_type)
        );

        CREATE TABLE IF NOT EXISTS monthly_variables (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id      TEXT,
            period          TEXT NOT NULL,
            primes_globales INTEGER DEFAULT 0,
            charges_globales_percent REAL DEFAULT 0,
            UNIQUE(company_id, period)
        );

        CREATE TABLE IF NOT EXISTS agent_loans (
            id                 TEXT PRIMARY KEY,
            company_id         TEXT,
            agent_name         TEXT NOT NULL,
            agent_function     TEXT,
            total_amount       INTEGER DEFAULT 0,
            motif              TEXT,
            date_granted       TEXT,
            monthly_deduction  INTEGER DEFAULT 0,
            start_period       TEXT,
            remaining_balance  INTEGER DEFAULT 0,
            status             TEXT DEFAULT 'active',
            created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS agent_adjustments (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id       TEXT,
            agent_id         TEXT NOT NULL,
            period           TEXT NOT NULL,
            type             TEXT NOT NULL, /* PRIME, AVANCE, RETENUE */
            amount           INTEGER DEFAULT 0,
            comment          TEXT,
            date_application TEXT,
            created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        /* NOUVELLES TABLES POUR LE MODULE DE GESTION DES CONGÉS */
        CREATE TABLE IF NOT EXISTS leave_types (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id      TEXT,
            name            TEXT NOT NULL,
            is_paid         INTEGER DEFAULT 1,
            requires_proof  INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS leave_balances (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id      TEXT,
            agent_id        TEXT NOT NULL,
            year            INTEGER NOT NULL,
            acquired        REAL DEFAULT 0.0,
            taken           REAL DEFAULT 0.0,
            pending         REAL DEFAULT 0.0,
            UNIQUE(company_id, agent_id, year)
        );

        CREATE TABLE IF NOT EXISTS leave_requests (
            id              TEXT PRIMARY KEY,
            company_id      TEXT,
            service_id      TEXT,
            agent_id        TEXT NOT NULL,
            leave_type_id   INTEGER NOT NULL,
            start_date      TEXT NOT NULL,
            end_date        TEXT NOT NULL,
            total_days      REAL NOT NULL,
            reason          TEXT,
            attachment_url  TEXT,
            status          TEXT DEFAULT 'pending', /* pending, approved, rejected */
            reviewed_by     TEXT,
            reviewed_at     DATETIME,
            review_comment  TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(leave_type_id) REFERENCES leave_types(id)
        );

        CREATE TABLE IF NOT EXISTS leave_settings (
            company_id      TEXT PRIMARY KEY,
            auto_increment  INTEGER DEFAULT 0,
            increment_rate  REAL DEFAULT 2.0
        );

        CREATE TABLE IF NOT EXISTS absences_permissions (
            id              TEXT PRIMARY KEY,
            company_id      TEXT NOT NULL,
            agent_id        TEXT NOT NULL,
            reason          TEXT NOT NULL,
            start_datetime  TEXT NOT NULL,
            end_datetime    TEXT NOT NULL,
            duration_hours  REAL,
            recorded_by     TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS contracts (
            id              TEXT PRIMARY KEY,
            company_id      TEXT NOT NULL,
            agent_id        TEXT NOT NULL,
            contract_type   TEXT NOT NULL DEFAULT 'CDI',
            start_date      TEXT NOT NULL,
            end_date        TEXT,
            trial_end_date  TEXT,
            salary          REAL DEFAULT 0,
            position        TEXT,
            department      TEXT,
            status          TEXT DEFAULT 'active',
            notes           TEXT,
            created_by      TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        /* TABLE DE SNAPSHOT PAIE — Gel des données au moment de la publication */
        CREATE TABLE IF NOT EXISTS payroll_snapshots (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id  TEXT NOT NULL,
            period      TEXT NOT NULL,
            snapshot    TEXT NOT NULL,  /* JSON dump de generateSalariesData au moment publish */
            published_by TEXT,          /* service_id de l'auteur */
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(company_id, period)
        );
        CREATE INDEX IF NOT EXISTS idx_snapshots_company_period ON payroll_snapshots(company_id, period);

        /* ARCHIVES DES RUPTURES DE CONTRATS */
        CREATE TABLE IF NOT EXISTS contract_ruptures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT,
            subsite_id TEXT,
            subsite_name TEXT,
            site_name TEXT,
            motif TEXT,
            effectif INTEGER,
            montant_total INTEGER,
            contract_rows TEXT,
            archived_at TEXT,
            archived_by TEXT,
            is_billed INTEGER DEFAULT 1,
            rupture_date TEXT
        );

        /* TABLE POUR SUPPLEMENTAIRES EXTERNES */
        CREATE TABLE IF NOT EXISTS supplementaires_externes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT,
            agent_id TEXT NOT NULL,
            site_origine_id TEXT NOT NULL,
            site_destination_id TEXT NOT NULL,
            date_supp TEXT NOT NULL,
            vacation TEXT NOT NULL,
            periode TEXT,
            agent_remplace TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        /* TABLE POUR L'ARCHIVAGE DES SUPPLEMENTAIRES (Fluctuation) */
        CREATE TABLE IF NOT EXISTS supplementaires_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT,
            period TEXT,
            agent_id TEXT,
            agent_name TEXT,
            date_supp TEXT,
            shift_label TEXT,
            montant_gagne REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        /* TABLE RÉCLAMATIONS — Migré depuis pointage_db.json */
        CREATE TABLE IF NOT EXISTS reclamations (
            id                          TEXT PRIMARY KEY,
            company_id                  TEXT NOT NULL DEFAULT 'comp_default_1',

            service_declarant           TEXT,
            agent_nom                   TEXT,
            agent_matricule             TEXT,
            agent_site                  TEXT,
            agent_fonction              TEXT,
            date_entree                 TEXT,
            reclamation_categorie       TEXT DEFAULT 'Salaire',
            reclamation_categorie_autre TEXT,
            categorie                   TEXT DEFAULT 'DIVERS',
            declarant_nom               TEXT,
            declarant_prenom            TEXT,
            declarant_matricule         TEXT,
            declarant_fonction          TEXT,
            declarant_service           TEXT,
            type_erreur                 TEXT,
            type_erreur_autre           TEXT,
            mois_concerne               TEXT,
            jours_concernes             TEXT,
            premiere_reclamation        TEXT DEFAULT 'Oui',
            ponction_precedente_correcte TEXT DEFAULT 'Non',
            montant_estime              REAL DEFAULT 0,
            action_demandee             TEXT,
            description                 TEXT,
            radio_code                  TEXT,
            radio_signature             TEXT,
            statut                      TEXT DEFAULT 'En attente',
            statut_final                TEXT DEFAULT '',
            motif_refus                 TEXT DEFAULT '',
            services_cibles             TEXT DEFAULT '[]',
            avis_secretariat            TEXT DEFAULT '',
            avis_comptabilite           TEXT DEFAULT '',
            created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_reclamations_company ON reclamations(company_id);

        /* TABLE PORTAIL AGENT — Migré depuis agent_users.json */
        CREATE TABLE IF NOT EXISTS agent_portal_users (
            id          TEXT PRIMARY KEY,
            service_id  TEXT NOT NULL,
            agent_id    TEXT NOT NULL UNIQUE,
            name        TEXT,
            matricule   TEXT,
            phone       TEXT,
            dob         TEXT,
            pin         TEXT NOT NULL,
            status      TEXT DEFAULT 'pending',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_portal_service ON agent_portal_users(service_id);
        CREATE INDEX IF NOT EXISTS idx_portal_agent ON agent_portal_users(agent_id);
    ");

    try {
        $pdo->exec("ALTER TABLE agent_loans ADD COLUMN agent_id TEXT");
    } catch(Exception $e) {}
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

function checkRateLimit(string $ip, string $email = '', int $maxAttempts = 5, int $windowMinutes = 15): bool
{
    $db = getDb();
    $since = date('Y-m-d H:i:s', time() - ($windowMinutes * 60));
    $stmt = $db->prepare(
        'SELECT COUNT(*) as cnt FROM login_attempts
         WHERE ip = ? AND success = 0 AND created_at > ?'
    );
    $stmt->execute([$ip, $since]);
    $row = $stmt->fetch();
    return (int)($row['cnt'] ?? 0) < $maxAttempts;
}

function recordLoginAttempt(string $ip, string $email, bool $success): void
{
    $db = getDb();
    $db->prepare(
        'INSERT INTO login_attempts (ip, email, success) VALUES (?, ?, ?)'
    )->execute([$ip, $email, $success ? 1 : 0]);
}

function getRemainingAttempts(string $ip, int $maxAttempts = 5, int $windowMinutes = 15): int
{
    $db = getDb();
    $since = date('Y-m-d H:i:s', time() - ($windowMinutes * 60));
    $stmt = $db->prepare(
        'SELECT COUNT(*) as cnt FROM login_attempts
         WHERE ip = ? AND success = 0 AND created_at > ?'
    );
    $stmt->execute([$ip, $since]);
    $row = $stmt->fetch();
    return max(0, $maxAttempts - (int)($row['cnt'] ?? 0));
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

function getAttendanceStats(string $companyId, string $period = ''): array
{
    $db = getDb();
    if ($period === '') {
        $period = date('Y-m');
    }

    // Total agents actifs
    $stmtTotal = $db->prepare(
        'SELECT COUNT(DISTINCT agent_id) as total FROM attendance WHERE company_id = ? AND period = ?'
    );
    $stmtTotal->execute([$companyId, $period]);
    $total = (int)($stmtTotal->fetch()['total'] ?? 0);

    // Présents (status = '1')
    $stmtPresent = $db->prepare(
        "SELECT COUNT(DISTINCT agent_id) as present FROM attendance
         WHERE company_id = ? AND period = ? AND status = '1' AND date = ?"
    );
    $today = date('Y-m-d');
    $stmtPresent->execute([$companyId, $period, $today]);
    $present = (int)($stmtPresent->fetch()['present'] ?? 0);

    // Absents (status = 'A')
    $stmtAbsent = $db->prepare(
        "SELECT COUNT(DISTINCT agent_id) as absent FROM attendance
         WHERE company_id = ? AND period = ? AND status = 'A' AND date = ?"
    );
    $stmtAbsent->execute([$companyId, $period, $today]);
    $absent = (int)($stmtAbsent->fetch()['absent'] ?? 0);

    // Retards (status = 'R')
    $stmtLate = $db->prepare(
        "SELECT COUNT(DISTINCT agent_id) as late FROM attendance
         WHERE company_id = ? AND period = ? AND status = 'R' AND date = ?"
    );
    $stmtLate->execute([$companyId, $period, $today]);
    $late = (int)($stmtLate->fetch()['late'] ?? 0);

    // Présences par jour de la semaine (7 derniers jours)
    $byDay = [];
    for ($i = 6; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-$i days"));
        $dayName = date('D', strtotime($d));
        $s = $db->prepare(
            "SELECT COUNT(*) as cnt FROM attendance
             WHERE company_id = ? AND date = ? AND status = '1'"
        );
        $s->execute([$companyId, $d]);
        $byDay[] = ['day' => $dayName, 'date' => $d, 'count' => (int)($s->fetch()['cnt'] ?? 0)];
    }

    // Évolution mensuelle (6 derniers mois)
    $monthly = [];
    for ($i = 5; $i >= 0; $i--) {
        $m = date('Y-m', strtotime("-$i months"));
        $s = $db->prepare(
            "SELECT COUNT(*) as cnt FROM attendance
             WHERE company_id = ? AND period = ? AND status = '1'"
        );
        $s->execute([$companyId, $m]);
        $monthly[] = ['month' => $m, 'count' => (int)($s->fetch()['cnt'] ?? 0)];
    }

    // Absentéisme sur la période
    $stmtAbsPeriod = $db->prepare("SELECT COUNT(*) as cnt FROM attendance WHERE company_id = ? AND period = ? AND status = 'A'");
    $stmtAbsPeriod->execute([$companyId, $period]);
    $absPeriod = (int)($stmtAbsPeriod->fetch()['cnt'] ?? 0);

    $stmtPresPeriod = $db->prepare("SELECT COUNT(*) as cnt FROM attendance WHERE company_id = ? AND period = ? AND status = '1'");
    $stmtPresPeriod->execute([$companyId, $period]);
    $presPeriod = (int)($stmtPresPeriod->fetch()['cnt'] ?? 0);

    $absenteeism = 0;
    if ($absPeriod + $presPeriod > 0) {
        $absenteeism = round(($absPeriod / ($absPeriod + $presPeriod)) * 100, 2);
    }

    // Turnover sur la période
    $stmtDepartures = $db->prepare("SELECT COUNT(*) as cnt FROM agents WHERE company_id = ? AND exit_date LIKE ?");
    $stmtDepartures->execute([$companyId, $period . '%']);
    $departures = (int)($stmtDepartures->fetch()['cnt'] ?? 0);

    $turnover = 0;
    if ($total > 0) {
        $turnover = round(($departures / $total) * 100, 2);
    }

    return [
        'total_agents'  => $total,
        'present_today' => $present,
        'absent_today'  => $absent,
        'late_today'    => $late,
        'by_day'        => $byDay,
        'monthly'       => $monthly,
        'absenteeism'   => $absenteeism,
        'turnover'      => $turnover,
        'period'        => $period,
    ];
}
