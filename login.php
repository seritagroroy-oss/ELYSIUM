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
    <title>Connexion - Pointage Pro</title>
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
            max-width: 440px;
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
            background: #22c55e;
            color: #052e2b;
        }

        .status {
            margin-top: 10px;
            min-height: 18px;
            color: #fca5a5;
            font-size: .9rem;
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
$logoUrl = $baseUrl . '/frontend/public/elysium_logo.png';
?>
<body>
    <div class="card">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="<?php echo $logoUrl; ?>" alt="ELYSIUM Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid rgba(56,189,248,0.6); box-shadow: 0 0 12px rgba(56,189,248,0.4); object-fit: cover; margin-bottom: 12px;">
            <h1 style="margin:0; font-size: 2rem; background: linear-gradient(135deg, #fff 0%, #38bdf8 60%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ELYSIUM</h1>
        </div>
        <p class="sub" style="text-align: center;">Connectez-vous à votre compte.</p>
        <form id="login-form">
            <label for="email">Email</label>
            <input id="email" type="email" required placeholder="nom@entreprise.com">
            <label for="password">Mot de passe</label>
            <input id="password" type="password" required placeholder="Votre mot de passe">
            <button type="submit">Se connecter</button>
        </form>
        <div id="status" class="status"></div>
        <div class="links">
            <a href="index.php">Accueil</a>
            <a href="register.php">Créer un compte</a>
        </div>
    </div>

    <script>
        const NEXT_URL = <?php echo json_encode($next); ?>;
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('status');
            status.textContent = '';
            try {
                const res = await fetch('api.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: document.getElementById('email').value.trim(),
                        password: document.getElementById('password').value
                    })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Connexion impossible');
                if (data.subscription_required) window.location.href = 'subscription.php';
                else if (NEXT_URL) window.location.href = NEXT_URL;
                else window.location.href = 'dashboard.php';
            } catch (e2) {
                status.textContent = e2.message || 'Erreur serveur';
            }
        });
    </script>
</body>

</html>