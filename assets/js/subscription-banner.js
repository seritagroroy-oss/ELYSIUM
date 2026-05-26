(function () {
    function initSubscriptionBanner(options) {
        const opts = options || {};
        const state = window.SUBSCRIPTION_STATE || null;
        const banner = document.getElementById(opts.bannerId || 'subscription-banner');
        const textEl = document.getElementById(opts.textId || 'subscription-banner-text');
        const btn = document.getElementById(opts.buttonId || 'btn-go-premium');
        const lockSelector = opts.lockSelector || '.lock-target';

        if (!state || !banner || !textEl) return;

        banner.style.display = 'flex';
        banner.classList.remove('trial', 'expired', 'active');

        if (!state.access_allowed) {
            banner.classList.add('expired');
            textEl.textContent = opts.expiredText || "Abonnement admin expiré/non actif. Fonctionnalités bloquées jusqu'au paiement.";
            if (btn) btn.textContent = opts.expiredButtonText || 'Payer et réactiver';
            document.body.classList.add('subscription-locked');
            document.querySelectorAll(lockSelector).forEach(el => el.classList.add('subscription-lock-disabled'));
            return;
        }

        if (state.status === 'trial') {
            banner.classList.add('trial');
            const days = Number(state.trial_days_left || 0);
            textEl.textContent = (opts.trialTextPrefix || 'Mode gratuit actif : il reste ') + days + (opts.trialTextSuffix || " jour(s). Passez en Premium.");
            if (btn) btn.textContent = opts.trialButtonText || 'Passer en Premium';
            return;
        }

        banner.classList.add('active');
        textEl.textContent = (opts.activeTextPrefix || 'Mode Premium actif. Échéance : ') + (state.subscription_until || '-') + '.';
        if (btn) btn.textContent = opts.activeButtonText || 'Gérer l\'abonnement';
    }

    window.initSubscriptionBanner = initSubscriptionBanner;
})();
