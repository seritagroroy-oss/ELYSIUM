<?php
session_start();
include 'lang.php';
include 'db.php';

$isLoggedIn = isset($_SESSION['user_id']);
$subscriptionState = $isLoggedIn ? getUserSubscriptionState($_SESSION['user_id']) : null;
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement Premium - Pointage Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #10b981;
            --bg: #0c0a09;
            --card: rgba(255, 255, 255, 0.06);
            --border: rgba(255, 255, 255, 0.12);
            --text: #f8fafc;
            --muted: #94a3b8;
            --danger: #ef4444;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            min-height: 100vh;
            color: var(--text);
            background:
                radial-gradient(circle at top right, rgba(245, 158, 11, 0.1), transparent 50%),
                radial-gradient(circle at bottom left, rgba(120, 113, 108, 0.08), transparent 40%),
                var(--bg);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        @keyframes rotate-bg {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        .card {
            width: 100%;
            max-width: 680px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 28px;
            backdrop-filter: blur(8px);
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.1);
        }

        .card::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(transparent, var(--primary), transparent 30%);
            animation: rotate-bg 6s linear infinite;
            opacity: 0.3;
            pointer-events: none;
            z-index: 0;
        }

        .card-inner {
            position: relative;
            z-index: 1;
        }

        h1 {
            font-size: 1.9rem;
            margin-bottom: 10px;
        }

        .subtitle {
            color: var(--muted);
            margin-bottom: 20px;
        }

        .badge {
            display: inline-block;
            padding: 7px 12px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 0.82rem;
            margin-bottom: 16px;
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.45);
            color: #a7f3d0;
        }

        .badge.expired {
            background: rgba(239, 68, 68, 0.16);
            border-color: rgba(239, 68, 68, 0.4);
            color: #fca5a5;
        }

        .plan {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 18px;
            margin: 16px 0;
            position: relative;
            transition: all 0.3s ease;
        }

        .plan:hover {
            border-color: rgba(16, 185, 129, 0.4);
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
            background: rgba(16, 185, 129, 0.05);
        }

        .billing-cycle {
            margin-top: 14px;
        }

        .billing-cycle label {
            display: block;
            margin-bottom: 8px;
            font-size: 0.92rem;
            color: var(--muted);
            font-weight: 600;
        }

        .billing-options {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .billing-option {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border: 1px solid var(--border);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.03);
            color: var(--text);
            font-weight: 600;
            cursor: pointer;
        }

        .billing-option input[type="radio"] {
            accent-color: #10b981;
        }

        .price {
            font-size: 2rem;
            font-weight: 800;
            color: var(--primary);
        }

        .muted {
            color: var(--muted);
        }

        ul {
            margin: 14px 0 10px 18px;
            color: #dbeafe;
        }

        li {
            margin-bottom: 8px;
        }

        .actions {
            display: flex;
            gap: 12px;
            margin-top: 18px;
            flex-wrap: wrap;
        }

        .providers {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 8px;
        }

        .provider-select {
            width: 100%;
            margin-top: 12px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: rgba(255, 255, 255, 0.03);
            color: var(--text);
            padding: 10px 12px;
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
        }

        .provider-chip {
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 7px 12px;
            font-size: 0.85rem;
            color: var(--muted);
        }

        button,
        .link-btn {
            border: none;
            border-radius: 10px;
            padding: 12px 16px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn-primary {
            background: var(--primary);
            color: #052e2b;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.06);
            color: var(--text);
            border: 1px solid var(--border);
        }

        #status-msg {
            margin-top: 12px;
            font-size: 0.95rem;
            color: var(--muted);
        }

        #status-msg.error {
            color: #fca5a5;
        }
    </style>
</head>

<body>
    <div class="card">
        <div class="card-inner">
            <div id="status-badge" class="badge">Verification abonnement...</div>
            <h1>Abonnement Premium</h1>
            <p class="subtitle">Essai gratuit de 15 jours, puis choisissez la formule mensuelle ou annuelle pour
                continuer
                l'utilisation de la plateforme.</p>

            <div class="plan">
                <div class="price"><span id="plan-price">20.000 F CFA</span> <span id="plan-period" class="muted"
                        style="font-size:1rem; font-weight:600;">/ mois</span></div>
                <ul>
                    <li>Acces complet au pointage et aux modifications</li>
                    <li>Acces aux archives et calcul des salaires</li>
                    <li>Conservation des donnees de votre service</li>
                </ul>
                <div class="billing-cycle">
                    <label>Formule d abonnement</label>
                    <div class="billing-options">
                        <label class="billing-option">
                            <input type="radio" name="billing-cycle" value="1" checked>
                            <span>Mensuel - 20.000 F CFA / mois</span>
                        </label>
                        <label class="billing-option">
                            <input type="radio" name="billing-cycle" value="12">
                            <span>Annuel - 240.000 F CFA / an</span>
                        </label>
                    </div>
                </div>
                <p id="subscription-detail" class="muted"></p>
                <div id="providers" class="providers"></div>
                <select id="provider-select" class="provider-select">
                    <option value="stripe">Stripe (carte bancaire)</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="wave">Wave</option>
                </select>
            </div>

            <div class="actions">
                <button id="btn-subscribe" class="btn-primary" type="button">
                    <i class="fas fa-credit-card"></i>
                    Payer maintenant
                </button>
                <button id="btn-logout" class="btn-secondary" type="button">
                    <i class="fas fa-right-from-bracket"></i>
                    <?php echo $isLoggedIn ? 'Deconnexion' : 'Retour accueil'; ?>
                </button>
            </div>
            <?php if (!$isLoggedIn): ?>
                <div style="margin-top:12px; color: var(--muted);">
                    Connectez-vous ou creez un compte pour payer et activer votre abonnement.
                    <div style="margin-top:8px;">
                        <a href="login.php" style="color:#93c5fd; text-decoration:none; margin-right:10px;">Connexion</a>
                        <a href="register.php" style="color:#93c5fd; text-decoration:none;">Creation de compte</a>
                    </div>
                </div>
            <?php endif; ?>
            <div id="status-msg"></div>
        </div>
    </div>

    <script>
        const IS_LOGGED_IN = <?php echo $isLoggedIn ? 'true' : 'false'; ?>;
        const MONTHLY_PRICE = 20000;

        async function loadSubscriptionStatus() {
            if (!IS_LOGGED_IN) {
                const badge = document.getElementById('status-badge');
                const detail = document.getElementById('subscription-detail');
                badge.textContent = 'Presentation abonnement';
                badge.className = 'badge';
                detail.textContent = 'Offre disponible apres connexion.';
                return;
            }
            const badge = document.getElementById('status-badge');
            const detail = document.getElementById('subscription-detail');
            const statusMsg = document.getElementById('status-msg');
            statusMsg.textContent = '';
            statusMsg.className = '';
            try {
                const res = await fetch('api.php?action=get_subscription_status');
                const data = await res.json();
                if (!data.success) {
                    statusMsg.textContent = data.message || 'Impossible de verifier le statut.';
                    statusMsg.className = 'error';
                    return;
                }
                const s = data.subscription || {};
                if (s.status === 'active') {
                    badge.textContent = 'Abonnement actif';
                    badge.className = 'badge';
                    detail.textContent = 'Votre abonnement est actif jusqu au ' + (s.subscription_until || '-') + '.';
                    setTimeout(() => { window.location.href = 'dashboard.php'; }, 1000);
                    return;
                }
                if (s.status === 'trial') {
                    badge.textContent = 'Essai gratuit actif';
                    badge.className = 'badge';
                    detail.textContent = 'Il vous reste ' + (s.trial_days_left || 0) + ' jour(s) d essai. Fin: ' + (s.trial_ends_at || '-');
                } else {
                    badge.textContent = 'Essai expire';
                    badge.className = 'badge expired';
                    detail.textContent = 'Votre essai est termine. Souscrivez en mensuel ou en annuel pour continuer.';
                }
            } catch (e) {
                statusMsg.textContent = 'Erreur serveur lors de la verification.';
                statusMsg.className = 'error';
            }
        }

        function formatFcfa(amount) {
            return new Intl.NumberFormat('fr-FR').format(amount) + ' F CFA';
        }

        function updatePlanPriceLabel() {
            const cycle = document.querySelector('input[name="billing-cycle"]:checked');
            const priceEl = document.getElementById('plan-price');
            const periodEl = document.getElementById('plan-period');
            if (!cycle || !priceEl || !periodEl) return;

            const months = parseInt(cycle.value || '1', 10) || 1;
            const total = MONTHLY_PRICE * months;
            priceEl.textContent = formatFcfa(total);
            periodEl.textContent = months === 12 ? '/ an' : '/ mois';
        }

        async function loadPaymentProviders() {
            const box = document.getElementById('providers');
            const select = document.getElementById('provider-select');
            if (!box) return;
            box.innerHTML = '';
            try {
                const res = await fetch('api.php?action=get_payment_providers');
                const data = await res.json();
                if (!data.success) return;
                const enabled = [];
                (data.providers || []).forEach(p => {
                    const el = document.createElement('span');
                    el.className = 'provider-chip';
                    el.textContent = p.name + (p.enabled ? ' disponible' : ' indisponible');
                    box.appendChild(el);
                    if (p.enabled) enabled.push(p.id);
                });
                if (select) {
                    Array.from(select.options).forEach(opt => {
                        opt.disabled = enabled.indexOf(opt.value) === -1;
                    });
                    const firstEnabled = enabled[0] || '';
                    if (firstEnabled) {
                        select.value = firstEnabled;
                    }
                }
            } catch (e) { }
        }

        async function startCheckout() {
            if (!IS_LOGGED_IN) {
                const statusMsg = document.getElementById('status-msg');
                statusMsg.textContent = 'Connectez-vous d abord pour proceder au paiement.';
                statusMsg.className = 'error';
                setTimeout(() => {
                    window.location.href = 'login.php?next=subscription.php';
                }, 600);
                return;
            }
            const btn = document.getElementById('btn-subscribe');
            const statusMsg = document.getElementById('status-msg');
            const providerSelect = document.getElementById('provider-select');
            const cycleSelect = document.querySelector('input[name="billing-cycle"]:checked');
            const provider = providerSelect ? providerSelect.value : 'stripe';
            const months = cycleSelect ? parseInt(cycleSelect.value || '1', 10) : 1;
            btn.disabled = true;
            btn.textContent = 'Redirection paiement...';
            statusMsg.textContent = '';
            statusMsg.className = '';
            try {
                const res = await fetch('api.php?action=create_checkout_session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider, months })
                });
                const data = await res.json();
                if (!data.success) {
                    throw new Error(data.message || 'Creation de paiement impossible');
                }
                if (!data.checkout_url) {
                    throw new Error('URL de paiement manquante');
                }
                window.location.href = data.checkout_url;
            } catch (e) {
                statusMsg.textContent = e.message || 'Paiement impossible.';
                statusMsg.className = 'error';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-credit-card"></i> Payer maintenant';
            }
        }

        async function confirmStripePaymentIfNeeded() {
            if (!IS_LOGGED_IN) return;
            const qp = new URLSearchParams(window.location.search);
            if (qp.get('payment') !== 'success') return;
            const provider = qp.get('provider') || 'stripe';
            const statusMsg = document.getElementById('status-msg');
            statusMsg.textContent = 'Verification du paiement en cours...';
            try {
                let action = 'confirm_stripe_payment';
                let payload = { session_id: qp.get('session_id') };
                if (provider === 'orange_money' || provider === 'wave') {
                    action = 'confirm_cinetpay_payment';
                    payload = { transaction_id: qp.get('transaction_id') };
                }
                const res = await fetch('api.php?action=' + action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!data.success) {
                    throw new Error(data.message || 'Confirmation paiement impossible');
                }
                statusMsg.textContent = 'Paiement confirme. Redirection...';
                await loadSubscriptionStatus();
            } catch (e) {
                statusMsg.textContent = e.message || 'Confirmation impossible';
                statusMsg.className = 'error';
            }
        }

        document.getElementById('btn-subscribe').addEventListener('click', startCheckout);
        document.querySelectorAll('input[name="billing-cycle"]').forEach((el) => {
            el.addEventListener('change', updatePlanPriceLabel);
        });
        document.getElementById('btn-logout').addEventListener('click', async () => {
            if (!IS_LOGGED_IN) {
                window.location.href = 'index.php';
                return;
            }
            try {
                await fetch('api.php?action=logout', { method: 'POST' });
            } catch (e) { }
            window.location.href = 'index.php';
        });
        loadPaymentProviders();
        confirmStripePaymentIfNeeded();
        loadSubscriptionStatus();
        updatePlanPriceLabel();
    </script>
</body>

</html>