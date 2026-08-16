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
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN statut_final VARCHAR(255) DEFAULT ''"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN motif_refus TEXT"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN services_cibles TEXT"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN agent_nom TEXT"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN agent_matricule TEXT"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN reclamation_categorie TEXT"); } catch (Exception $e) {}
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
            $db->exec("CREATE INDEX IF NOT EXISTS idx_archives_pointage_company ON archives_pointage(company_id)");
            $db->exec("CREATE INDEX IF NOT EXISTS idx_archives_pointage_period ON archives_pointage(period)");
        } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN jours_concernes TEXT"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN montant_estime TEXT"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN mois_concerne TEXT"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN statut TEXT DEFAULT 'En attente'"); } catch (Exception $e) {}
        try { $db->exec("ALTER TABLE reclamations ADD COLUMN description TEXT"); } catch (Exception $e) {}
        // Removed duplicated archives_pointage block
        try { $db->exec("ALTER TABLE attendance ADD INDEX idx_att_agent_period_date (agent_id, period, date)"); } catch (Exception $e) {}
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
        try { $db->exec("ALTER TABLE agent_loans ADD COLUMN agent_id VARCHAR(100)"); } catch (Exception $e) {}
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
                    $db->prepare(''
                        INSERT INTO agent_portal_users (id, service_id, agent_id, name, matricule, phone, dob, pin, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    '')->execute([
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
                $db->prepare(''
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
                    $r['radio_signature'] ?? '', $r['statut'] ?? 'En attente', $r['avis_secretariat'] ?? '', $r['avis_comptabilite'] ?? '',
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
    $pdo->exec("\n        CREATE TABLE IF NOT EXISTS entreprises (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            logo_url    TEXT,
            plan        TEXT DEFAULT 'trial',
            settings    TEXT DEFAULT '{}',
            owner_email TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS users (
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
        );\n\n        CREATE TABLE IF NOT EXISTS agent_adjustments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT,
            type TEXT,
            amount REAL,
            motif TEXT,
            period TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS agent_sanctions (
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
        );\n\n        CREATE TABLE IF NOT EXISTS agent_long_absences (
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
        );\n\n        CREATE TABLE IF NOT EXISTS agent_mutations (
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
        );\n\n        CREATE TABLE IF NOT EXISTS private_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_email TEXT NOT NULL,
            receiver_email TEXT NOT NULL,
            message TEXT,
            file_url TEXT,
            file_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            company_id TEXT DEFAULT 'comp_default_1'
        );\n\n        CREATE TABLE IF NOT EXISTS message_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            is_announcement INTEGER DEFAULT 0,
            company_id TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS message_group_members (
            group_id TEXT NOT NULL,
            user_email TEXT NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(group_id, user_email)
        );\n\n        CREATE TABLE IF NOT EXISTS group_messages (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            content TEXT,
            attachment TEXT,
            attachment_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS user_statuses (
            id TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            company_id TEXT NOT NULL,
            content_type TEXT DEFAULT 'text',
            content TEXT NOT NULL,
            bg_color TEXT DEFAULT '#075e54',
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS active_calls (
            id TEXT PRIMARY KEY,
            caller_email TEXT NOT NULL,
            receiver_email TEXT NOT NULL,
            room_name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ringing',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS status_views (
            status_id TEXT NOT NULL,
            viewer_email TEXT NOT NULL,
            viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(status_id, viewer_email)
        );\n\n        CREATE TABLE IF NOT EXISTS services (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            company_id  TEXT,
            permissions TEXT DEFAULT '{}',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES entreprises(id) ON DELETE CASCADE
        );\n\n        CREATE TABLE IF NOT EXISTS sites (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            service_id  TEXT,
            company_id  TEXT,
            source_module TEXT DEFAULT 'PC',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS subsites (
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
        );\n\n        CREATE TABLE IF NOT EXISTS agents (
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
        );\n\n        CREATE TABLE IF NOT EXISTS attendance (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id    TEXT NOT NULL,
            date        TEXT NOT NULL,
            shift_code  TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT '1',
            service_id  TEXT,
            company_id  TEXT,
            period      TEXT,
            UNIQUE(agent_id, date, shift_code)
        );\n\n        CREATE TABLE IF NOT EXISTS tickets (
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
        );\n\n        CREATE TABLE IF NOT EXISTS messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id   TEXT,
            sender      TEXT NOT NULL,
            content     TEXT NOT NULL,
            is_pinned   INTEGER DEFAULT 0,
            service_id  TEXT,
            company_id  TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS login_attempts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ip          TEXT NOT NULL,
            email       TEXT,
            success     INTEGER DEFAULT 0,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS payments (
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
        );\n\n        CREATE TABLE IF NOT EXISTS archives (
            id          TEXT PRIMARY KEY,
            service_id  TEXT,
            company_id  TEXT,
            period      TEXT,
            data        TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS archives_pointage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT,
            period TEXT,
            archived_date DATETIME,
            archived_by TEXT,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );\n\n        CREATE TABLE IF NOT EXISTS salary_config (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id  TEXT,
            company_id  TEXT,
            config_key  TEXT,
            config_val  TEXT,
            UNIQUE(service_id, config_key)
        );
    ");

    // ... (rest of initSchema continues with other table definitions as previously)
}

// ... (rest of the file continues with functions for statistics, rate limiting, etc.)
?>
