<?php
require_once 'database.php';

$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$period = '2026-07';
$site_name_with_star = '🌟 EXTRA SUR SITE';
$site_name_clean = 'EXTRA SUR SITE';

// Old query (with star)
$like_m_old = 'M|' . $site_name_with_star . '%';
$stmt_old = $sqlite->prepare("
    SELECT COUNT(DISTINCT a.agent_id) as count
    FROM attendance a
    WHERE a.period = ?
    AND a.status LIKE ?
");
$stmt_old->execute([$period, $like_m_old]);
$count_old = $stmt_old->fetchColumn();

// New query (without star, using wildcard)
$like_m_new = 'M|%' . $site_name_clean . '%';
$stmt_new = $sqlite->prepare("
    SELECT COUNT(DISTINCT a.agent_id) as count
    FROM attendance a
    WHERE a.period = ?
    AND a.status LIKE ?
");
$stmt_new->execute([$period, $like_m_new]);
$count_new = $stmt_new->fetchColumn();

echo "TEST RESULT:\n";
echo "Count with star ('$like_m_old'): " . $count_old . "\n";
echo "Count with wildcard ('$like_m_new'): " . $count_new . "\n";

