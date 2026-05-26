<?php
session_start();
include 'lang.php';
include 'db.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$db_data = getData();
$all_services = $db_data['services'] ?? [];
$my_service = resolveCurrentServiceKey($db_data);

$section = $_GET['section'] ?? 'chat';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Communication - Pointage Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/scrollbar.css">
    <style>
        :root {
            --primary: #3b82f6;
            --bg-dark: #0f172a;
            --bg-sidebar: #1e293b;
            --bg-card: rgba(255, 255, 255, 0.03);
            --border: rgba(255, 255, 255, 0.1);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-dark);
            color: var(--text-main);
            margin: 0;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        .comm-sidebar {
            width: 300px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .back-btn {
            margin-bottom: 2rem;
            color: var(--text-muted);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            transition: 0.2s;
        }

        .back-btn:hover { color: var(--primary); }

        .nav-link {
            padding: 1rem 1.5rem;
            border-radius: 12px;
            color: var(--text-main);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: 0.3s;
            font-weight: 500;
        }
        .nav-link:hover { background: rgba(255, 255, 255, 0.05); }
        .nav-link.active { background: rgba(59, 130, 246, 0.1); color: var(--primary); border-left: 4px solid var(--primary); }

        .comm-content {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            position: relative;
        }

        /* Chat layout */
        .chat-container {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 8rem);
            background: var(--bg-sidebar);
            border-radius: 20px;
            border: 1px solid var(--border);
            overflow: hidden;
        }
        .chat-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border);
            background: rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .chat-messages {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .chat-input-area {
            padding: 1rem;
            border-top: 1px solid var(--border);
            background: rgba(0,0,0,0.2);
            display: flex;
            gap: 10px;
        }
        .chat-input-area input {
            flex: 1;
            padding: 1rem;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--border);
            border-radius: 10px;
            color: white;
            outline: none;
        }
        .msg-bubble {
            max-width: 70%;
            padding: 1rem;
            border-radius: 15px;
            background: rgba(255,255,255,0.05);
            align-self: flex-start;
        }
        .msg-bubble.mine {
            background: var(--primary);
            align-self: flex-end;
        }

        /* Tickets layout */
        .ticket-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-width: 900px;
        }
        .ticket-card {
            background: var(--bg-sidebar);
            padding: 1.5rem;
            border-radius: 15px;
            border: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .btn {
            padding: 0.8rem 1.5rem;
            border-radius: 10px;
            border: none;
            background: var(--primary);
            color: white;
            cursor: pointer;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <aside class="comm-sidebar">
        <a href="dashboard.php" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            <span>Retour au Dashboard</span>
        </a>
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem; padding-left: 1rem;">
            Communication
        </div>
        <a href="?section=chat" class="nav-link <?php echo $section == 'chat' ? 'active' : ''; ?>">
            <i class="fas fa-comments"></i>
            <span>Chat Inter-Services</span>
        </a>
        <a href="?section=tickets" class="nav-link <?php echo $section == 'tickets' ? 'active' : ''; ?>">
            <i class="fas fa-ticket"></i>
            <span>Gestion des Tickets</span>
        </a>
    </aside>

    <main class="comm-content">
        <?php if ($section === 'chat'): ?>
            <h1 style="margin-bottom: 1.5rem;">Chat Inter-Services</h1>
            <div class="chat-container">
                <div class="chat-header">
                    <select id="chat-dest" style="padding: 0.5rem 1rem; border-radius: 8px; background: rgba(0,0,0,0.5); border: 1px solid var(--border); color: white; outline: none; font-family: inherit;">
                        <option value="all">Tous les services</option>
                        <?php foreach($all_services as $svc): ?>
                            <?php if($svc['id'] !== $my_service): ?>
                                <option value="<?php echo htmlspecialchars($svc['id']); ?>"><?php echo htmlspecialchars($svc['name']); ?></option>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="chat-messages" id="chat-msgs">
                    <!-- Messages loaded via JS -->
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Taper un message..." onkeypress="if(event.key === 'Enter') sendChatMessage()">
                    <button class="btn" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        <?php else: ?>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; max-width: 900px;">
                <h1>Gestion des Tickets</h1>
                <button class="btn" onclick="document.getElementById('modal-new-ticket').style.display='flex'">Nouveau Ticket</button>
            </div>
            <div class="ticket-list" id="ticket-list">
                <!-- Tickets loaded via JS -->
            </div>

            <!-- Modal Nouveau Ticket -->
            <div id="modal-new-ticket" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); align-items:center; justify-content:center; z-index:100;">
                <div style="background:var(--bg-sidebar); padding:2rem; border-radius:15px; width:100%; max-width:500px; border:1px solid var(--border);">
                    <h3 style="margin-bottom:1rem;">Nouveau Ticket</h3>
                    <input type="text" id="tk-title" placeholder="Sujet / Titre" style="width:100%; padding:1rem; margin-bottom:1rem; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:10px; color:white; outline:none;">
                    <select id="tk-dest" style="width:100%; padding:1rem; margin-bottom:1rem; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:10px; color:white; outline:none;">
                        <option value="">-- Destinataire --</option>
                        <?php foreach($all_services as $svc): ?>
                            <?php if($svc['id'] !== $my_service): ?>
                                <option value="<?php echo htmlspecialchars($svc['id']); ?>"><?php echo htmlspecialchars($svc['name']); ?></option>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </select>
                    <textarea id="tk-content" placeholder="Description du problème..." style="width:100%; padding:1rem; margin-bottom:1rem; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:10px; color:white; min-height:100px; font-family:inherit; outline:none;"></textarea>
                    <div style="display:flex; justify-content:flex-end; gap:10px;">
                        <button class="btn" style="background:transparent; border:1px solid var(--border);" onclick="document.getElementById('modal-new-ticket').style.display='none'">Annuler</button>
                        <button class="btn" onclick="createTicket()">Créer Ticket</button>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </main>

    <script>
        const myService = "<?php echo $my_service; ?>";
        const isSuperAdmin = <?php echo (($_SESSION['user_role'] ?? '') === 'super_admin') ? 'true' : 'false'; ?>;
        
        async function loadMessages() {
            if("<?php echo $section; ?>" !== "chat") return;
            const res = await fetch('api.php?action=get_inter_service_messages');
            const data = await res.json();
            if(data.success) {
                const container = document.getElementById('chat-msgs');
                container.innerHTML = data.messages.map(m => {
                    const isMine = m.from_service === myService;
                    const destName = m.to_service === 'all' ? 'Tous' : m.to_service;
                    return `
                        <div class="msg-bubble ${isMine ? 'mine' : ''}">
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:5px;">
                                <b>${m.from_user}</b> (${m.from_service}) &rarr; ${destName} - ${m.timestamp}
                            </div>
                            <div>${m.content}</div>
                        </div>
                    `;
                }).join('');
                container.scrollTop = container.scrollHeight;
            }
        }

        async function sendChatMessage() {
            const content = document.getElementById('chat-input').value.trim();
            const to_service = document.getElementById('chat-dest').value;
            if(!content) return;
            
            const res = await fetch('api.php?action=send_inter_service_message', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ content, to_service })
            });
            const data = await res.json();
            if(data.success) {
                document.getElementById('chat-input').value = '';
                loadMessages();
            } else {
                alert(data.message || 'Erreur');
            }
        }

        async function loadTickets() {
            if("<?php echo $section; ?>" !== "tickets") return;
            const res = await fetch('api.php?action=get_tickets');
            const data = await res.json();
            if(data.success) {
                const container = document.getElementById('ticket-list');
                if(data.tickets.length === 0) {
                    container.innerHTML = '<div style="opacity:0.5; text-align:center; padding:2rem;">Aucun ticket.</div>';
                    return;
                }
                container.innerHTML = data.tickets.map(t => {
                    const isMine = t.from_service === myService;
                    let statusColor = t.status === 'open' ? '#f59e0b' : (t.status === 'resolved' ? '#10b981' : '#ef4444');
                    let statusLabel = t.status === 'open' ? 'Ouvert' : (t.status === 'resolved' ? 'Résolu' : 'Fermé');
                    
                    return `
                        <div class="ticket-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h3 style="margin:0;">${t.title}</h3>
                                <span style="background:${statusColor}20; color:${statusColor}; padding:4px 10px; border-radius:10px; font-size:0.8rem; font-weight:700;">${statusLabel}</span>
                            </div>
                            <div style="font-size:0.85rem; color:var(--text-muted);">
                                Par: <b>${t.from_user}</b> (${t.from_service}) &rarr; À: ${t.to_service} | ${t.timestamp}
                            </div>
                            <div style="margin-top:10px; padding:15px; background:rgba(0,0,0,0.2); border-radius:10px;">
                                ${t.content}
                            </div>
                            <div style="display:flex; gap:10px; margin-top:10px;">
                                ${t.status === 'open' && (t.to_service === myService || isSuperAdmin) ? `<button class="btn" style="background:#10b981; font-size:0.8rem; padding:0.5rem 1rem;" onclick="updateTicketStatus('${t.id}', 'resolved')"><i class="fas fa-check"></i> Marquer Résolu</button>` : ''}
                                ${t.status === 'open' && (isMine || isSuperAdmin) ? `<button class="btn" style="background:#ef4444; font-size:0.8rem; padding:0.5rem 1rem;" onclick="updateTicketStatus('${t.id}', 'closed')"><i class="fas fa-times"></i> Fermer</button>` : ''}
                            </div>
                        </div>
                    `;
                }).reverse().join('');
            }
        }

        async function createTicket() {
            const title = document.getElementById('tk-title').value.trim();
            const content = document.getElementById('tk-content').value.trim();
            const to_service = document.getElementById('tk-dest').value;
            
            if(!title || !content || !to_service) {
                alert('Veuillez remplir tous les champs'); return;
            }
            
            const res = await fetch('api.php?action=create_ticket', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ title, content, to_service })
            });
            const data = await res.json();
            if(data.success) {
                document.getElementById('modal-new-ticket').style.display='none';
                document.getElementById('tk-title').value = '';
                document.getElementById('tk-content').value = '';
                loadTickets();
            } else {
                alert(data.message || 'Erreur');
            }
        }

        async function updateTicketStatus(ticket_id, status) {
            const res = await fetch('api.php?action=update_ticket_status', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ ticket_id, status })
            });
            const data = await res.json();
            if(data.success) {
                loadTickets();
            } else {
                alert('Erreur lors de la mise à jour');
            }
        }

        // Init
        if("<?php echo $section; ?>" === "chat") {
            loadMessages();
            setInterval(loadMessages, 5000); // Polling pour le chat
        } else if("<?php echo $section; ?>" === "tickets") {
            loadTickets();
        }
    </script>
</body>
</html>
