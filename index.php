<?php
session_start();
include 'lang.php';
include 'db.php';

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
    <title>Pointage Pro - Accueil</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg: #0b1220;
            --card: rgba(255, 255, 255, 0.06);
            --border: rgba(255, 255, 255, 0.12);
            --text: #f8fafc;
            --muted: #94a3b8;
            --a: #22c55e;
            --b: #38bdf8;
            --c: #f59e0b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            color: var(--text);
            min-height: 100vh;
            background:
                radial-gradient(circle at 90% -10%, rgba(56, 189, 248, 0.18), transparent 35%),
                radial-gradient(circle at 0% 100%, rgba(34, 197, 94, 0.15), transparent 40%),
                var(--bg);
            padding: 24px;
        }

        .wrap {
            max-width: 1100px;
            margin: 0 auto;
        }

        .top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }

        .brand {
            font-size: 1.5rem;
            font-weight: 800;
        }

        .brand i {
            color: var(--b);
            margin-right: 8px;
        }

        .lang-selector {
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 6px 10px;
            background: rgba(255, 255, 255, 0.06);
        }

        .lang-selector select {
            background: transparent;
            border: none;
            color: var(--text);
            outline: none;
            font-weight: 600;
            font-family: 'Outfit', sans-serif;
        }

        h1 {
            font-size: 2rem;
            margin-bottom: 8px;
        }

        .subtitle {
            color: var(--muted);
            margin-bottom: 22px;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        }

        @keyframes rotate-bg {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        .option {
            display: block;
            position: relative;
            text-decoration: none;
            color: inherit;
            border-radius: 18px;
            padding: 1.5px;
            min-height: 250px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05);
            transition: all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .option::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            animation: rotate-bg 4s linear infinite;
            opacity: 0.4;
            transition: opacity .5s;
            pointer-events: none;
            z-index: 0;
            background: conic-gradient(transparent, var(--glow-color, var(--b)), transparent 30%);
        }

        .option:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
        }

        .option:hover::before {
            opacity: 1;
        }

        .option-inner {
            position: relative;
            z-index: 1;
            height: 100%;
            width: 100%;
            border-radius: 17px;
            background: rgba(15, 23, 42, 0.92);
            padding: 28px 22px;
            display: flex;
            flex-direction: column;
        }

        .option .icon {
            width: 50px;
            height: 50px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 14px;
            font-size: 1.25rem;
        }

        .option h3 {
            font-size: 1.15rem;
            margin-bottom: 8px;
        }

        .option p {
            color: var(--muted);
            line-height: 1.5;
        }

        .option.sub {
            --glow-color: var(--a);
            box-shadow: 0 12px 26px rgba(34, 197, 94, 0.15);
        }

        .option.reg {
            --glow-color: var(--b);
            box-shadow: 0 12px 26px rgba(56, 189, 248, 0.15);
        }

        .option.log {
            --glow-color: var(--c);
            box-shadow: 0 12px 26px rgba(245, 158, 11, 0.15);
        }

        .option.sub:hover {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.4);
        }

        .option.reg:hover {
            box-shadow: 0 0 30px rgba(56, 189, 248, 0.4);
        }

        .option.log:hover {
            box-shadow: 0 0 30px rgba(245, 158, 11, 0.4);
        }

        .option.sub .icon {
            background: rgba(34, 197, 94, .18);
            color: var(--a);
        }

        .option.reg .icon {
            background: rgba(56, 189, 248, .18);
            color: var(--b);
        }

        .option.log .icon {
            background: rgba(245, 158, 11, .18);
            color: var(--c);
        }

        @media (max-width: 980px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>
    <div class="wrap">
        <div class="top">
            <div class="brand"><i class="fa-solid fa-shield-halved"></i>Pointage Pro</div>
            <div class="lang-selector">
                <select onchange="changeLanguage(this.value)">
                    <option value="fr" <?php echo $lang == 'fr' ? 'selected' : ''; ?>>FR</option>
                    <option value="en" <?php echo $lang == 'en' ? 'selected' : ''; ?>>EN</option>
                    <option value="es" <?php echo $lang == 'es' ? 'selected' : ''; ?>>ES</option>
                    <option value="de" <?php echo $lang == 'de' ? 'selected' : ''; ?>>DE</option>
                    <option value="it" <?php echo $lang == 'it' ? 'selected' : ''; ?>>IT</option>
                    <option value="pt" <?php echo $lang == 'pt' ? 'selected' : ''; ?>>PT</option>
                </select>
            </div>
        </div>

        <h1>Bienvenue</h1>
        <p class="subtitle">Choisissez une option pour continuer.</p>

        <div class="grid">
            <a class="option sub" href="subscription.php">
                <div class="option-inner">
                    <div class="icon"><i class="fas fa-credit-card"></i></div>
                    <h3>Souscription Premium</h3>
                    <p>Voir l'offre, les moyens de paiement et activer votre abonnement.</p>
                </div>
            </a>
            <a class="option reg" href="register.php">
                <div class="option-inner">
                    <div class="icon"><i class="fas fa-user-plus"></i></div>
                    <h3>Creation de compte</h3>
                    <p>Creer un compte service avec essai gratuit de 15 jours.</p>
                </div>
            </a>
            <a class="option log" href="login.php">
                <div class="option-inner">
                    <div class="icon"><i class="fas fa-right-to-bracket"></i></div>
                    <h3>Connexion</h3>
                    <p>Se connecter pour acceder a la plateforme et aux fonctionnalites.</p>
                </div>
            </a>
        </div>
    </div>

    <script>
        async function changeLanguage(lang) {
            try {
                await fetch('api.php?action=set_lang', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lang })
                });
                window.location.reload();
            } catch (e) { }
        }
    </script>
</body>

</html>