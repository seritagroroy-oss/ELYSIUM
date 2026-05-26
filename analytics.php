<?php
session_start();
include 'lang.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}
$current_period = $_GET['period'] ?? date('Y-m');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytiques RH - Pointage Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Outfit', sans-serif; background: #0f172a; color: white; margin: 0; display: flex; flex-direction: column; height: 100vh; overflow-y: auto; }
        .header { display: flex; justify-content: space-between; padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .btn-back { background: #1e293b; color: white; padding: 10px 15px; text-decoration: none; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
        .charts-container { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem; }
        .chart-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.5rem; }
        .chart-card h3 { margin-top: 0; color: #94a3b8; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; }
        @media (max-width: 768px) { .charts-container { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="header">
        <div style="display:flex; align-items:center; gap:20px;">
            <a href="dashboard.php" class="btn-back"><i class="fas fa-arrow-left"></i> Retour au Tableau de bord</a>
            <h2 style="margin:0;">Tableau de Bord RH</h2>
        </div>
        <div>
            <select id="period-select" onchange="window.location.href='analytics.php?period='+this.value" style="background: #1e293b; color: white; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); outline:none;">
                <?php
                for ($i = 0; $i < 6; $i++) {
                    $p = date('Y-m', strtotime("-$i months"));
                    $selected = ($p == $current_period) ? 'selected' : '';
                    echo "<option value='$p' $selected>$p</option>";
                }
                ?>
            </select>
        </div>
    </div>

    <div class="charts-container">
        <div class="chart-card">
            <h3>Taux d'Absentéisme par Site</h3>
            <canvas id="absentChart"></canvas>
        </div>
        <div class="chart-card">
            <h3>Répartition de la Masse Salariale</h3>
            <canvas id="salaryChart"></canvas>
        </div>
        <div class="chart-card">
            <h3>Heures Supplémentaires par Site (FCFA)</h3>
            <canvas id="spChart"></canvas>
        </div>
        <div class="chart-card" style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <h3>Masse Salariale Totale</h3>
            <div id="totalMasse" style="font-size: 3rem; font-weight: 800; color: #3b82f6;">0 FCFA</div>
            <p style="color: #94a3b8; margin-top:10px;">Période : <?php echo $current_period; ?></p>
        </div>
    </div>

    <script>
        const period = '<?php echo $current_period; ?>';
        fetch(`api.php?action=get_salaries&period=${period}`)
            .then(r => r.json())
            .then(data => {
                const sites = {};
                let totalMasse = 0;

                data.forEach(row => {
                    if(!sites[row.site]) sites[row.site] = { absences: 0, agents: 0, salary: 0, sp_gains: 0 };
                    sites[row.site].absences += row.absences;
                    sites[row.site].agents += 1;
                    sites[row.site].salary += row.total;
                    sites[row.site].sp_gains += (row.gains || 0);
                    totalMasse += row.total;
                });

                document.getElementById('totalMasse').textContent = totalMasse.toLocaleString() + ' FCFA';

                const siteNames = Object.keys(sites);
                const absencesData = siteNames.map(s => sites[s].absences);
                const salaryData = siteNames.map(s => sites[s].salary);
                const spData = siteNames.map(s => sites[s].sp_gains);

                // Chart 1: Absences
                new Chart(document.getElementById('absentChart'), {
                    type: 'bar',
                    data: {
                        labels: siteNames,
                        datasets: [{ label: 'Jours d\'absence', data: absencesData, backgroundColor: '#ef4444', borderRadius: 6 }]
                    },
                    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });

                // Chart 2: Salary Distribution
                new Chart(document.getElementById('salaryChart'), {
                    type: 'doughnut',
                    data: {
                        labels: siteNames,
                        datasets: [{ data: salaryData, backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'] }]
                    },
                    options: { plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }
                });

                // Chart 3: SP
                new Chart(document.getElementById('spChart'), {
                    type: 'bar',
                    data: {
                        labels: siteNames,
                        datasets: [{ label: 'Primes & Heures Sup (FCFA)', data: spData, backgroundColor: '#10b981', borderRadius: 6 }]
                    },
                    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
            });
    </script>
</body>
</html>
