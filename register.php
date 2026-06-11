<?php
session_start();
include 'lang.php';
include 'db.php';

$next = $_GET['next'] ?? '';
$allowedNext = ['subscription.php', 'dashboard.php', 'index.php'];
if (!in_array($next, $allowedNext, true)) {
    $next = '';
}

if (isset($_SESSION['user_id'])) {
    $subState = getUserSubscriptionState($_SESSION['user_id']);
    if (empty($subState['access_allowed'])) {
        header('Location: subscription.php');
    } else {
        header('Location: dashboard.php');
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Creation de compte - Pointage Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: 'Outfit', sans-serif;
            background: #0f172a;
            color: #fff;
        }

        .card {
            width: 100%;
            max-width: 520px;
            background: rgba(255, 255, 255, .06);
            border: 1px solid rgba(255, 255, 255, .13);
            border-radius: 18px;
            padding: 24px;
        }

        h1 {
            margin: 0 0 8px;
        }

        .sub {
            color: #94a3b8;
            margin-bottom: 16px;
        }

        label {
            display: block;
            margin: 10px 0 6px;
            color: #cbd5e1;
            font-size: .92rem;
        }

        input {
            width: 100%;
            padding: 11px 12px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, .16);
            background: rgba(2, 6, 23, .5);
            color: #fff;
        }

        button {
            width: 100%;
            margin-top: 14px;
            padding: 12px;
            border: none;
            border-radius: 10px;
            font-weight: 700;
            cursor: pointer;
            background: #38bdf8;
            color: #062132;
        }

        .status {
            margin-top: 10px;
            min-height: 18px;
            color: #fca5a5;
            font-size: .9rem;
        }

        .status.ok {
            color: #86efac;
        }

        .links {
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
        }

        .links a {
            color: #93c5fd;
            text-decoration: none;
            font-size: .9rem;
        }
    </style>
</head>

<?php
$baseUrl = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
if ($baseUrl === '/') $baseUrl = '';
$logoUrl = $baseUrl . '/elysium_logo.png';
?>
<body>
    <div class="card">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="<?php echo $logoUrl; ?>" alt="ELYSIUM Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid rgba(56,189,248,0.6); box-shadow: 0 0 12px rgba(56,189,248,0.4); object-fit: cover; margin-bottom: 12px;">
            <h1 style="margin:0; font-size: 2rem; background: linear-gradient(135deg, #fff 0%, #38bdf8 60%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ELYSIUM</h1>
        </div>
        <p class="sub" style="text-align: center;">Essai gratuit de 15 jours inclus.</p>
        <form id="register-form">
            <label for="service">Service</label>
            <input id="service" type="text" required placeholder="RH, Logistique, Comptabilité...">
            <label for="name">Nom complet</label>
            <input id="name" type="text" required placeholder="Nom et prenom">
            <label for="email">Email</label>
            <input id="email" type="email" required placeholder="nom@gmail.com">
            <label for="password">Mot de passe</label>
            <input id="password" type="password" required placeholder="6 caracteres minimum">
            <button type="submit">Créer mon compte</button>
        </form>
        <div id="status" class="status"></div>
        <div class="links">
            <a href="index.php">Accueil</a>
            <a href="login.php">Se connecter</a>
        </div>
    </div>

    <script>
        const NEXT_URL = <?php echo json_encode($next); ?>;
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('status');
            status.className = 'status';
            status.textContent = 'Creation du compte en cours...';
            try {
                const res = await fetch('api.php?action=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service_name: document.getElementById('service').value.trim(),
                        name: document.getElementById('name').value.trim(),
                        email: document.getElementById('email').value.trim(),
                        password: document.getElementById('password').value
                    })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Creation impossible');
                status.className = 'status ok';
                status.textContent = 'Compte cree. Redirection...';
                if (data.subscription_required) window.location.href = 'subscription.php';
                else if (NEXT_URL) window.location.href = NEXT_URL;
                else window.location.href = 'dashboard.php';
            } catch (e2) {
                status.className = 'status';
                status.textContent = e2.message || 'Erreur serveur';
            }
        });
    </script>
</body>

</html>