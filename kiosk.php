<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pointeuse Autonome - Kiosque</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: 'Outfit', sans-serif; background: #0f172a; color: white; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
        .kiosk-container { background: #1e293b; padding: 3rem; border-radius: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 40px rgba(0,0,0,0.5); max-width: 500px; width: 90%; }
        #video-container { width: 100%; height: 250px; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 20px; position: relative; }
        video { width: 100%; height: 100%; object-fit: cover; }
        .pin-input { font-size: 2rem; padding: 15px; text-align: center; width: 100%; box-sizing: border-box; background: #0f172a; border: 2px solid #3b82f6; border-radius: 12px; color: white; outline: none; margin-bottom: 20px; letter-spacing: 5px; }
        .btn-punch { background: #10b981; color: white; font-size: 1.2rem; font-weight: 700; border: none; padding: 15px 30px; border-radius: 12px; cursor: pointer; transition: 0.2s; width: 100%; }
        .btn-punch:hover { background: #059669; }
        .clock { font-size: 3rem; font-weight: 800; color: #3b82f6; margin-bottom: 10px; }
        .btn-back { position: absolute; top: 20px; left: 20px; color: white; text-decoration: none; background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <a href="dashboard.php" class="btn-back"><i class="fas fa-arrow-left"></i> Retour</a>
    
    <div class="kiosk-container">
        <div class="clock" id="clock">00:00:00</div>
        <p style="color: #94a3b8; margin-bottom: 30px;">Placez-vous devant la caméra (Uniforme visible) et tapez votre Code Agent.</p>
        
        <div id="video-container">
            <video id="camera" autoplay playsinline></video>
            <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(239,68,68,0.8); padding: 5px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: bold;">
                <i class="fas fa-circle" style="font-size: 0.5rem; vertical-align: middle;"></i> REC
            </div>
        </div>
        
        <input type="text" id="agent-pin" class="pin-input" placeholder="ID-AGENT" maxlength="6" autocomplete="off">
        <button class="btn-punch" onclick="punchIn()"><i class="fas fa-check-circle"></i> VALIDER MON POINTAGE</button>
        
        <div id="status-msg" style="margin-top: 20px; font-weight: bold; display:none;"></div>
    </div>

    <script>
        // Horloge
        setInterval(() => { document.getElementById('clock').textContent = new Date().toLocaleTimeString('fr-FR'); }, 1000);

        // Webcam Anti-Fraude
        const video = document.getElementById('camera');
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { video.srcObject = stream; })
                .catch(err => console.error("Erreur caméra :", err));
        }

        function punchIn() {
            const pin = document.getElementById('agent-pin').value;
            const msg = document.getElementById('status-msg');
            msg.style.display = 'block';
            
            if(pin.length < 3) {
                msg.style.color = '#ef4444';
                msg.textContent = 'Code Agent Invalide';
                return;
            }

            // Simuler la capture photo et l'envoi API
            msg.style.color = '#10b981';
            msg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Vérification faciale et enregistrement...`;
            
            setTimeout(() => {
                msg.innerHTML = `<i class="fas fa-check"></i> Pointage Confirmé pour ${pin} à ${new Date().toLocaleTimeString('fr-FR')}`;
                document.getElementById('agent-pin').value = '';
                
                // Disparaître après 3 sec
                setTimeout(() => { msg.style.display = 'none'; }, 3000);
            }, 1500);
        }
    </script>
</body>
</html>
