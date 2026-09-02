<?php
/**
 * Module Paiements & Abonnements
 * Extrait de api_new.php
 */

switch ($action) {

    case 'get_payment_providers':
        $paymentCfg = getPaymentConfig();
        $hasCinetpay = !empty($paymentCfg['cinetpay_api_key']) && !empty($paymentCfg['cinetpay_site_id']);
        echo json_encode([
            'success' => true,
            'providers' => [
                ['id' => 'stripe', 'name' => 'Stripe', 'enabled' => !empty($paymentCfg['stripe_secret_key'])],
                ['id' => 'orange_money', 'name' => 'Orange Money', 'enabled' => $hasCinetpay && !empty($paymentCfg['enable_orange_money'])],
                ['id' => 'wave', 'name' => 'Wave', 'enabled' => $hasCinetpay && !empty($paymentCfg['enable_wave'])]
            ]
        ]);
        break;

    case 'create_checkout_session':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expiree']);
            break;
        }
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Seul le compte administrateur peut souscrire et payer.']);
            break;
        }

        $provider = strtolower(trim((string) ($data['provider'] ?? 'stripe')));
        $months = (int) ($data['months'] ?? 1);
        if ($months < 1) {
            $months = 1;
        }
        if ($months > 12) {
            $months = 12;
        }

        $cfg = getSubscriptionConfig();
        $currency = strtolower((string) ($cfg['currency'] ?? 'xof'));
        $price = (int) ($cfg['monthly_price'] ?? 20000);
        $amount = $price * $months;
        $baseUrl = getBaseUrl();

        if ($provider === 'stripe') {
            $params = [
                'mode' => 'payment',
                'success_url' => $baseUrl . '/subscription.php?payment=success&provider=stripe&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $baseUrl . '/subscription.php?payment=cancel&provider=stripe',
                'line_items[0][quantity]' => 1,
                'line_items[0][price_data][currency]' => $currency,
                'line_items[0][price_data][product_data][name]' => 'Pointage Pro - Abonnement Premium',
                'line_items[0][price_data][unit_amount]' => $amount,
                'metadata[email]' => $email,
                'metadata[months]' => (string) $months
            ];

            $stripe = stripeApiRequest('POST', 'checkout/sessions', $params);
            if (empty($stripe['ok'])) {
                echo json_encode(['success' => false, 'message' => $stripe['error'] ?? 'Erreur Stripe']);
                break;
            }

            $session = $stripe['data'] ?? [];
            $sessionId = (string) ($session['id'] ?? '');
            $checkoutUrl = (string) ($session['url'] ?? '');
            if ($sessionId === '' || $checkoutUrl === '') {
                echo json_encode(['success' => false, 'message' => 'Session de paiement invalide']);
                break;
            }

            addPaymentRecord('stripe', $sessionId, $email, $amount, strtoupper($currency), ['months' => $months, 'owner_admin_email' => $email]);
            echo json_encode(['success' => true, 'checkout_url' => $checkoutUrl, 'session_id' => $sessionId]);
            break;
        }

        if ($provider === 'orange_money' || $provider === 'wave') {
            $transactionId = 'txn_' . time() . '_' . rand(1000, 9999);
            $channel = ($provider === 'orange_money') ? 'ORANGE_MONEY' : 'WAVE';
            $notifyUrl = $baseUrl . '/api.php?action=cinetpay_notify';
            $returnUrl = $baseUrl . '/subscription.php?payment=success&provider=' . rawurlencode($provider) . '&transaction_id=' . rawurlencode($transactionId);
            $cancelUrl = $baseUrl . '/subscription.php?payment=cancel&provider=' . rawurlencode($provider);

            $initPayload = [
                'transaction_id' => $transactionId,
                'amount' => $amount,
                'currency' => strtoupper($currency),
                'description' => 'Abonnement Premium Pointage Pro',
                'customer_name' => (string) ($_SESSION['user_name'] ?? 'Utilisateur'),
                'customer_email' => $email,
                'notify_url' => $notifyUrl,
                'return_url' => $returnUrl,
                'channels' => $channel,
                'metadata' => json_encode(['email' => $email, 'months' => $months, 'provider' => $provider])
            ];

            $cinetpay = cinetpayApiRequest('init', $initPayload);
            if (empty($cinetpay['ok'])) {
                echo json_encode(['success' => false, 'message' => $cinetpay['error'] ?? 'Erreur CinetPay']);
                break;
            }

            $respData = $cinetpay['data']['data'] ?? [];
            $payUrl = (string) ($respData['payment_url'] ?? '');
            if ($payUrl === '') {
                echo json_encode(['success' => false, 'message' => 'URL de paiement CinetPay manquante']);
                break;
            }

            addPaymentRecord('cinetpay', $transactionId, $email, $amount, strtoupper($currency), ['months' => $months, 'provider' => $provider, 'cancel_url' => $cancelUrl, 'owner_admin_email' => $email]);
            echo json_encode(['success' => true, 'checkout_url' => $payUrl, 'transaction_id' => $transactionId]);
            break;
        }

        echo json_encode(['success' => false, 'message' => 'Provider de paiement non supporte']);
        break;

    case 'confirm_stripe_payment':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expiree']);
            break;
        }
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Seul le compte administrateur peut confirmer le paiement.']);
            break;
        }
        $sessionId = trim((string) ($data['session_id'] ?? ''));
        if ($sessionId === '') {
            echo json_encode(['success' => false, 'message' => 'Session de paiement manquante']);
            break;
        }

        $stripe = stripeApiRequest('GET', 'checkout/sessions/' . rawurlencode($sessionId));
        if (empty($stripe['ok'])) {
            echo json_encode(['success' => false, 'message' => $stripe['error'] ?? 'Verification Stripe impossible']);
            break;
        }

        $session = $stripe['data'] ?? [];
        $paid = (($session['payment_status'] ?? '') === 'paid');
        if (!$paid) {
            echo json_encode(['success' => false, 'message' => 'Paiement non confirme']);
            break;
        }

        $sessionEmail = strtolower((string) ($session['metadata']['email'] ?? ''));
        if ($sessionEmail !== '' && $sessionEmail !== strtolower($email)) {
            echo json_encode(['success' => false, 'message' => 'Paiement non associe a ce compte']);
            break;
        }

        $months = (int) ($session['metadata']['months'] ?? 1);
        if ($months < 1) {
            $months = 1;
        }

        markPaymentAsPaid('stripe', $sessionId);
        if (!activatePlatformSubscription($months, $email)) {
            echo json_encode(['success' => false, 'message' => 'Activation abonnement impossible']);
            break;
        }

        $state = getUserSubscriptionState($email);
        $_SESSION['subscription_state'] = $state;
        echo json_encode(['success' => true, 'message' => 'Paiement confirme', 'subscription' => $state]);
        break;

    case 'confirm_cinetpay_payment':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expiree']);
            break;
        }
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Seul le compte administrateur peut confirmer le paiement.']);
            break;
        }

        $transactionId = trim((string) ($data['transaction_id'] ?? ''));
        if ($transactionId === '') {
            echo json_encode(['success' => false, 'message' => 'Transaction CinetPay manquante']);
            break;
        }

        $paymentRecord = getPaymentByProviderExternalId('cinetpay', $transactionId);
        if (!$paymentRecord) {
            echo json_encode(['success' => false, 'message' => 'Transaction inconnue']);
            break;
        }

        $check = cinetpayApiRequest('check', ['transaction_id' => $transactionId]);
        if (empty($check['ok'])) {
            echo json_encode(['success' => false, 'message' => $check['error'] ?? 'Verification CinetPay impossible']);
            break;
        }

        $status = strtoupper((string) (($check['data']['data']['status'] ?? $check['data']['data']['payment_status'] ?? '')));
        if ($status !== 'ACCEPTED') {
            echo json_encode(['success' => false, 'message' => 'Paiement non confirme (' . $status . ')']);
            break;
        }

        $months = (int) (($paymentRecord['meta']['months'] ?? 1));
        if ($months < 1) {
            $months = 1;
        }

        markPaymentAsPaid('cinetpay', $transactionId);
        if (!activatePlatformSubscription($months, $email)) {
            echo json_encode(['success' => false, 'message' => 'Activation abonnement impossible']);
            break;
        }

        $_SESSION['subscription_state'] = getUserSubscriptionState($email);
        echo json_encode(['success' => true, 'message' => 'Paiement CinetPay confirme']);
        break;

    case 'cinetpay_notify':
        $txnFromPost = trim((string) ($_POST['cpm_trans_id'] ?? $_POST['transaction_id'] ?? ''));
        $txnFromJson = trim((string) ($data['transaction_id'] ?? ''));
        $transactionId = $txnFromPost !== '' ? $txnFromPost : $txnFromJson;
        if ($transactionId === '') {
            echo json_encode(['success' => false, 'message' => 'transaction_id manquant']);
            break;
        }

        $paymentRecord = getPaymentByProviderExternalId('cinetpay', $transactionId);
        if (!$paymentRecord) {
            echo json_encode(['success' => false, 'message' => 'Transaction inconnue']);
            break;
        }

        $check = cinetpayApiRequest('check', ['transaction_id' => $transactionId]);
        if (empty($check['ok'])) {
            echo json_encode(['success' => false, 'message' => $check['error'] ?? 'Verification CinetPay impossible']);
            break;
        }

        $status = strtoupper((string) (($check['data']['data']['status'] ?? $check['data']['data']['payment_status'] ?? '')));
        if ($status === 'ACCEPTED') {
            $months = (int) (($paymentRecord['meta']['months'] ?? 1));
            if ($months < 1) {
                $months = 1;
            }
            markPaymentAsPaid('cinetpay', $transactionId);
            activatePlatformSubscription($months, $paymentRecord['meta']['owner_admin_email'] ?? null);
        }

        echo json_encode(['success' => true]);
        break;

    case 'get_subscription_status':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expirÃ©e']);
            break;
        }
        echo json_encode(['success' => true, 'subscription' => getUserSubscriptionState($email)]);
        break;

    case 'activate_subscription':
        $currentEmail = $_SESSION['user_id'] ?? '';
        if ($currentEmail === '') {
            echo json_encode(['success' => false, 'message' => 'Session expirÃ©e']);
            break;
        }

        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Action reservee a l admin. Utilisez le paiement en ligne.']);
            break;
        }

        $months = (int) ($data['months'] ?? 1);
        if ($months < 1) {
            $months = 1;
        }

        if (!activatePlatformSubscription($months, $currentEmail)) {
            echo json_encode(['success' => false, 'message' => 'Activation de l\'abonnement impossible']);
            break;
        }

        $state = getUserSubscriptionState($currentEmail);
        $_SESSION['subscription_state'] = $state;

        echo json_encode([
            'success' => true,
            'message' => 'Abonnement actif',
            'subscription' => $state
        ]);
        break;

} // end switch payments
