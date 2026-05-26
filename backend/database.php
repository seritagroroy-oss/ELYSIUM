<?php
/**
 * database.php — Couche SQLite3 pour ELYSIUM
 * Utilise l'extension SQLite3 native de PHP (pdo_sqlite non requis).
 * Compatible PHP 8+ avec sqlite3 intégré.
 */

define('SQLITE_FILE', __DIR__ . '/elysium.db');

/**
 * Wrapper léger autour de SQLite3 pour reproduire l'API PDO
 * (prepare/execute/fetch) utilisée dans le reste du code.
 */
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
        if ($result) {
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
}

function getDb(): ElysiumDb
{
    static $db = null;
    if ($db !== null) {
        return $db;
    }
    $db = new ElysiumDb(SQLITE_FILE);
    initSchema($db);
    return $db;
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
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            email               TEXT UNIQUE NOT NULL,
            password            TEXT NOT NULL,
            name                TEXT,
            role                TEXT DEFAULT 'user',
            role_display_name   TEXT,
            service             TEXT,
            service_id          TEXT,
            company_id          TEXT DEFAULT 'comp_default_1',
            permissions         TEXT DEFAULT '{}',
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
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS subsites (
            id      TEXT PRIMARY KEY,
            name    TEXT NOT NULL,
            site_id TEXT NOT NULL,
            FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS agents (
            id              TEXT PRIMARY KEY,
            name            TEXT NOT NULL,
            function        TEXT,
            shift_type      TEXT,
            has_sp          INTEGER DEFAULT 0,
            hire_date       TEXT,
            recruitment_cost INTEGER DEFAULT 0,
            subsite_id      TEXT,
            service_id      TEXT,
            company_id      TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
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
            status      TEXT DEFAULT 'pending',
            company_id  TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS archives (
            id          TEXT PRIMARY KEY,
            service_id  TEXT,
            company_id  TEXT,
            period      TEXT,
            data        TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS salary_config (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id  TEXT,
            company_id  TEXT,
            config_key  TEXT,
            config_val  TEXT,
            UNIQUE(service_id, config_key)
        );

        CREATE INDEX IF NOT EXISTS idx_attendance_agent_date ON attendance(agent_id, date);
        CREATE INDEX IF NOT EXISTS idx_attendance_service ON attendance(service_id, period);
        CREATE INDEX IF NOT EXISTS idx_messages_ticket ON messages(ticket_id);
        CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip, created_at);
        CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
        CREATE INDEX IF NOT EXISTS idx_agents_service ON agents(service_id);
    ");
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

    return [
        'total_agents'  => $total,
        'present_today' => $present,
        'absent_today'  => $absent,
        'late_today'    => $late,
        'by_day'        => $byDay,
        'monthly'       => $monthly,
        'period'        => $period,
    ];
}
