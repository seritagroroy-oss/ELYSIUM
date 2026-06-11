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
    <title>Communication - Elysium</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            /* Telegram / WhatsApp inspired theme */
            --bg-body: #0e1621;
            --bg-sidebar: #17212b;
            --bg-chat: #0e1621;
            --bg-message-in: #182533;
            --bg-message-out: #2b5278;
            --primary: #5288c1;
            --primary-hover: #3b6b9b;
            --text-main: #f5f5f5;
            --text-muted: #7f91a4;
            --border: #2b3947;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-body);
            color: var(--text-main);
            height: 100vh;
            display: flex;
            overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
            width: 350px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            z-index: 10;
        }

        .sidebar-header {
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 15px;
            border-bottom: 1px solid var(--border);
            background: var(--bg-sidebar);
        }

        .back-btn {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 1.2rem;
            transition: 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }
        .back-btn:hover { background: rgba(255,255,255,0.05); color: var(--primary); }

        .search-container {
            flex: 1;
        }
        .search-container input {
            width: 100%;
            background: #242f3d;
            border: none;
            border-radius: 20px;
            padding: 0.6rem 1rem;
            color: white;
            outline: none;
        }

        .tabs {
            display: flex;
            border-bottom: 1px solid var(--border);
        }
        .tab {
            flex: 1;
            text-align: center;
            padding: 1rem;
            color: var(--text-muted);
            text-decoration: none;
            font-weight: 500;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: 0.3s;
        }
        .tab:hover { color: var(--text-main); background: rgba(255,255,255,0.02); }
        .tab.active { color: var(--primary); border-bottom-color: var(--primary); }

        .chat-list {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }
        .chat-list::-webkit-scrollbar { width: 5px; }
        .chat-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }

        .chat-item {
            padding: 1rem 1.5rem;
            display: flex;
            gap: 15px;
            cursor: pointer;
            transition: 0.2s;
            border-bottom: 1px solid rgba(255,255,255,0.02);
            align-items: center;
        }
        .chat-item:hover { background: #202b36; }
        .chat-item.active { background: var(--primary); }
        .chat-item.active .chat-preview, .chat-item.active .chat-time { color: rgba(255,255,255,0.8); }

        .avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.2rem;
            color: white;
            flex-shrink: 0;
            text-transform: uppercase;
        }

        .chat-info { flex: 1; overflow: hidden; }
        .chat-top { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .chat-name { font-weight: 600; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-time { font-size: 0.75rem; color: var(--text-muted); }
        .chat-preview { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Main Chat Area */
        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--bg-chat);
            position: relative;
        }
        .chat-area::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url('assets/img/chat-bg.png'); /* Pattern WhatsApp/Telegram */
            background-size: 400px;
            opacity: 0.05;
            pointer-events: none;
            z-index: 0;
        }

        .chat-header {
            padding: 1rem 2rem;
            background: var(--bg-sidebar);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1;
        }

        .chat-header-info h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 3px; }
        .chat-header-info p { font-size: 0.8rem; color: var(--primary); }

        .messages-container {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            z-index: 1;
        }
        .messages-container::-webkit-scrollbar { width: 5px; }
        .messages-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }

        .message {
            max-width: 65%;
            padding: 0.8rem 1rem;
            border-radius: 15px;
            position: relative;
            animation: fadeIn 0.3s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            line-height: 1.5;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .message.in {
            background: var(--bg-message-in);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }
        .message.out {
            background: var(--bg-message-out);
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }

        .msg-sender { font-size: 0.75rem; font-weight: 600; color: var(--primary); margin-bottom: 3px; }
        .message.out .msg-sender { display: none; }
        .msg-text { font-size: 0.95rem; }
        .msg-time { font-size: 0.7rem; color: rgba(255,255,255,0.5); text-align: right; margin-top: 5px; display: flex; justify-content: flex-end; align-items: center; gap: 5px; }

        .chat-input-wrapper {
            padding: 1.5rem 2rem;
            background: var(--bg-sidebar);
            border-top: 1px solid var(--border);
            z-index: 1;
            display: flex;
            gap: 15px;
            align-items: flex-end;
        }

        .chat-input-box {
            flex: 1;
            background: #242f3d;
            border-radius: 20px;
            display: flex;
            align-items: center;
            padding: 0.5rem 1rem;
        }

        .chat-input-box textarea {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
            padding: 0.5rem;
            max-height: 150px;
            min-height: 24px;
            resize: none;
            outline: none;
            font-family: inherit;
            font-size: 1rem;
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 1.2rem;
            cursor: pointer;
            padding: 10px;
            border-radius: 50%;
            transition: 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .icon-btn:hover { color: var(--primary); background: rgba(255,255,255,0.05); }

        .send-btn {
            background: var(--primary);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            cursor: pointer;
            transition: 0.2s;
            box-shadow: 0 4px 10px rgba(82, 136, 193, 0.3);
            flex-shrink: 0;
        }
        .send-btn:hover { background: var(--primary-hover); transform: scale(1.05); }

        /* Tickets Styles */
        .ticket-list-area {
            padding: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
            overflow-y: auto;
            flex: 1;
            z-index: 1;
        }
        .ticket-card {
            background: #182533;
            border: 1px solid var(--border);
            border-radius: 15px;
            padding: 1.5rem;
            transition: 0.3s;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .ticket-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); }
        .ticket-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .ticket-title { font-size: 1.1rem; font-weight: 600; color: white; margin-bottom: 5px; }
        .ticket-status { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .status-open { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .status-resolved { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .status-closed { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        
        .ticket-meta { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 5px; }
        .ticket-desc { background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 10px; font-size: 0.9rem; line-height: 1.5; margin: 10px 0; flex: 1; }
        
        .btn { padding: 0.6rem 1.2rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; color: white; display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; }
        .btn-primary { background: var(--primary); }
        .btn-success { background: var(--success); }
        .btn-danger { background: var(--danger); }
        .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); gap: 15px; z-index: 1; }
        .empty-state i { font-size: 4rem; opacity: 0.5; }

        /* Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: none; align-items: center; justify-content: center; z-index: 100; opacity: 0; transition: 0.3s; }
        .modal-overlay.active { display: flex; opacity: 1; }
        .modal-content { background: var(--bg-sidebar); padding: 2rem; border-radius: 20px; width: 100%; max-width: 500px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.4); transform: scale(0.9); transition: 0.3s; }
        .modal-overlay.active .modal-content { transform: scale(1); }
        
        .input-group { margin-bottom: 1.5rem; }
        .input-group label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 500; }
        .input-group input, .input-group select, .input-group textarea { width: 100%; background: #242f3d; border: 1px solid var(--border); border-radius: 10px; padding: 1rem; color: white; outline: none; font-family: inherit; transition: 0.2s; }
        .input-group input:focus, .input-group select:focus, .input-group textarea:focus { border-color: var(--primary); }

    </style>
</head>
<body>

    <div class="sidebar">
        <div class="sidebar-header">
            <a href="dashboard.php" class="back-btn"><i class="fas fa-arrow-left"></i></a>
            <div class="search-container">
                <input type="text" placeholder="Rechercher...">
            </div>
        </div>

        <div class="tabs">
            <a href="?section=chat" class="tab <?php echo $section === 'chat' ? 'active' : ''; ?>">
                <i class="fas fa-comments"></i> Discussions
            </a>
            <a href="?section=tickets" class="tab <?php echo $section === 'tickets' ? 'active' : ''; ?>">
                <i class="fas fa-ticket"></i> Tickets
            </a>
        </div>

        <div class="chat-list" id="sidebar-list">
            <?php if($section === 'chat'): ?>
                <!-- Contacts (Services) -->
                <div class="chat-item active" onclick="selectContact('all', 'Tous les services')" id="contact-all">
                    <div class="avatar" style="background: linear-gradient(135deg, #10b981, #059669);"><i class="fas fa-users"></i></div>
                    <div class="chat-info">
                        <div class="chat-top">
                            <span class="chat-name">Tous les services</span>
                        </div>
                        <div class="chat-preview">Canal général de communication</div>
                    </div>
                </div>
                <?php foreach($all_services as $svc): ?>
                    <?php if($svc['id'] !== $my_service): ?>
                        <div class="chat-item" onclick="selectContact('<?php echo $svc['id']; ?>', '<?php echo htmlspecialchars($svc['name']); ?>')" id="contact-<?php echo $svc['id']; ?>">
                            <div class="avatar"><?php echo strtoupper(substr($svc['name'], 0, 2)); ?></div>
                            <div class="chat-info">
                                <div class="chat-top">
                                    <span class="chat-name"><?php echo htmlspecialchars($svc['name']); ?></span>
                                </div>
                                <div class="chat-preview">Cliquez pour voir les messages</div>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            <?php else: ?>
                <!-- Un ticket summary list could go here, but for now we just show a button -->
                <div style="padding: 2rem; text-align: center;">
                    <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="openTicketModal()">
                        <i class="fas fa-plus"></i> Créer un Ticket
                    </button>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 1rem;">
                        Les tickets servent à signaler des incidents graves ou des demandes d'intervention.
                    </p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <div class="chat-area">
        <?php if($section === 'chat'): ?>
            <div class="chat-header">
                <div class="avatar" id="current-chat-avatar" style="background: linear-gradient(135deg, #10b981, #059669);"><i class="fas fa-users"></i></div>
                <div class="chat-header-info">
                    <h2 id="current-chat-name">Tous les services</h2>
                    <p>En ligne</p>
                </div>
                <div style="margin-left: auto; display: flex; gap: 15px;">
                    <button class="icon-btn"><i class="fas fa-search"></i></button>
                    <button class="icon-btn"><i class="fas fa-ellipsis-v"></i></button>
                </div>
            </div>

            <div class="messages-container" id="chat-msgs">
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h2>Sélectionnez une conversation</h2>
                    <p>Choisissez un service dans le menu de gauche</p>
                </div>
            </div>

            <div class="chat-input-wrapper">
                <button class="icon-btn"><i class="fas fa-paperclip"></i></button>
                <div class="chat-input-box">
                    <button class="icon-btn" style="padding: 5px;"><i class="far fa-smile"></i></button>
                    <textarea id="chat-input" placeholder="Écrire un message..." oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'" onkeypress="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendChatMessage(); }"></textarea>
                </div>
                <button class="send-btn" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
            </div>
            
        <?php else: ?>
            <div class="chat-header" style="justify-content: space-between;">
                <div class="chat-header-info">
                    <h2>Centre de Support & Interventions</h2>
                    <p>Gérez vos tickets d'incidents</p>
                </div>
            </div>
            
            <div class="ticket-list-area" id="ticket-list">
                <!-- Tickets -->
            </div>
            
            <div class="modal-overlay" id="ticketModal">
                <div class="modal-content">
                    <h2 style="margin-bottom: 1.5rem; color: white;">Nouveau Ticket d'Incident</h2>
                    
                    <div class="input-group">
                        <label>Sujet de l'incident</label>
                        <input type="text" id="tk-title" placeholder="Ex: Panne de caméra Secteur A">
                    </div>
                    
                    <div class="input-group">
                        <label>Service Assigné (Destinataire)</label>
                        <select id="tk-dest">
                            <option value="">Sélectionner un service compétent</option>
                            <?php foreach($all_services as $svc): ?>
                                <?php if($svc['id'] !== $my_service): ?>
                                    <option value="<?php echo htmlspecialchars($svc['id']); ?>"><?php echo htmlspecialchars($svc['name']); ?></option>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <label>Description Détaillée</label>
                        <textarea id="tk-content" placeholder="Veuillez décrire le problème avec précision..." rows="4"></textarea>
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 2rem;">
                        <button class="btn" style="background: transparent; color: var(--text-muted);" onclick="closeTicketModal()">Annuler</button>
                        <button class="btn btn-primary" onclick="createTicket()"><i class="fas fa-paper-plane"></i> Soumettre</button>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <script>
        const myService = "<?php echo $my_service; ?>";
        const section = "<?php echo $section; ?>";
        const isSuperAdmin = <?php echo (($_SESSION['user_role'] ?? '') === 'super_admin') ? 'true' : 'false'; ?>;
        
        let currentTarget = 'all';
        let allMessages = [];

        // CHAT LOGIC
        function selectContact(id, name) {
            currentTarget = id;
            document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
            document.getElementById('contact-' + id).classList.add('active');
            
            document.getElementById('current-chat-name').innerText = name;
            const avatar = document.getElementById('current-chat-avatar');
            if(id === 'all') {
                avatar.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                avatar.innerHTML = '<i class="fas fa-users"></i>';
            } else {
                avatar.style.background = 'linear-gradient(135deg, var(--primary), #8b5cf6)';
                avatar.innerHTML = name.substring(0, 2).toUpperCase();
            }
            
            renderMessages();
        }

        async function fetchMessages() {
            if(section !== 'chat') return;
            try {
                const res = await fetch('api.php?action=get_inter_service_messages');
                const data = await res.json();
                if(data.success) {
                    allMessages = data.messages;
                    renderMessages();
                }
            } catch(e) {}
        }

        function renderMessages() {
            const container = document.getElementById('chat-msgs');
            const filtered = allMessages.filter(m => {
                if(currentTarget === 'all') return m.to_service === 'all';
                // Direct messages
                return (m.from_service === myService && m.to_service === currentTarget) || 
                       (m.from_service === currentTarget && m.to_service === myService);
            });

            if(filtered.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comment-dots"></i>
                        <h2>Aucun message</h2>
                        <p>Soyez le premier à dire bonjour !</p>
                    </div>
                `;
                return;
            }

            // Group messages by date/time ideally, but let's just render them simply
            container.innerHTML = filtered.map(m => {
                const isMine = m.from_service === myService;
                // m.timestamp example "2026-05-27 12:00:00" -> extract time
                const time = m.timestamp.split(' ')[1].substring(0, 5); 
                const tick = isMine ? '<i class="fas fa-check-double" style="color: #38bdf8;"></i>' : '';
                
                return `
                    <div class="message ${isMine ? 'out' : 'in'}">
                        <div class="msg-sender">${m.from_user} (${m.from_service})</div>
                        <div class="msg-text">${m.content}</div>
                        <div class="msg-time">${time} ${tick}</div>
                    </div>
                `;
            }).join('');
            
            container.scrollTop = container.scrollHeight;
        }

        async function sendChatMessage() {
            const input = document.getElementById('chat-input');
            const content = input.value.trim();
            if(!content) return;
            
            // Optimistic UI update
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            allMessages.push({
                from_service: myService,
                to_service: currentTarget,
                from_user: 'Moi',
                content: content,
                timestamp: 'Aujourd\'hui ' + timeStr
            });
            input.value = '';
            input.style.height = '';
            renderMessages();
            
            try {
                await fetch('api.php?action=send_inter_service_message', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ content, to_service: currentTarget })
                });
                fetchMessages(); // refresh to get DB ID
            } catch(e) {}
        }

        // TICKET LOGIC
        async function loadTickets() {
            if(section !== 'tickets') return;
            try {
                const res = await fetch('api.php?action=get_tickets');
                const data = await res.json();
                if(data.success) {
                    const container = document.getElementById('ticket-list');
                    if(data.tickets.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state" style="grid-column: 1 / -1;">
                                <i class="fas fa-check-circle" style="color: var(--success); opacity: 1;"></i>
                                <h2>Aucun incident en cours</h2>
                                <p>Tout fonctionne parfaitement. Créez un ticket si vous rencontrez un problème.</p>
                            </div>
                        `;
                        return;
                    }
                    
                    container.innerHTML = data.tickets.reverse().map(t => {
                        const isMine = t.from_service === myService;
                        const stClass = t.status === 'open' ? 'status-open' : (t.status === 'resolved' ? 'status-resolved' : 'status-closed');
                        const stLabel = t.status === 'open' ? 'Ouvert' : (t.status === 'resolved' ? 'Résolu' : 'Fermé');
                        const time = t.timestamp.split(' ')[0]; // Just date for tickets
                        
                        return `
                            <div class="ticket-card">
                                <div class="ticket-header">
                                    <div class="ticket-title">${t.title}</div>
                                    <span class="ticket-status ${stClass}">${stLabel}</span>
                                </div>
                                <div class="ticket-meta">
                                    <i class="far fa-clock"></i> ${time} &nbsp;&bull;&nbsp; 
                                    <i class="far fa-user"></i> ${t.from_service} &rarr; ${t.to_service}
                                </div>
                                <div class="ticket-desc">
                                    ${t.content}
                                </div>
                                <div style="display:flex; gap:10px; margin-top:auto; padding-top:10px;">
                                    ${t.status === 'open' && (t.to_service === myService || isSuperAdmin) ? 
                                        `<button class="btn btn-success" style="flex:1; justify-content:center;" onclick="updateTicketStatus('${t.id}', 'resolved')"><i class="fas fa-check"></i> Résoudre</button>` : ''}
                                    ${t.status === 'open' && (isMine || isSuperAdmin) ? 
                                        `<button class="btn btn-danger" style="flex:1; justify-content:center;" onclick="updateTicketStatus('${t.id}', 'closed')"><i class="fas fa-times"></i> Fermer</button>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } catch(e) {}
        }

        function openTicketModal() {
            document.getElementById('ticketModal').classList.add('active');
        }
        function closeTicketModal() {
            document.getElementById('ticketModal').classList.remove('active');
        }

        async function createTicket() {
            const title = document.getElementById('tk-title').value.trim();
            const content = document.getElementById('tk-content').value.trim();
            const to_service = document.getElementById('tk-dest').value;
            
            if(!title || !content || !to_service) {
                alert('Veuillez remplir tous les champs'); return;
            }
            
            try {
                const res = await fetch('api.php?action=create_ticket', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ title, content, to_service })
                });
                const data = await res.json();
                if(data.success) {
                    closeTicketModal();
                    document.getElementById('tk-title').value = '';
                    document.getElementById('tk-content').value = '';
                    loadTickets();
                }
            } catch(e) {}
        }

        async function updateTicketStatus(ticket_id, status) {
            try {
                await fetch('api.php?action=update_ticket_status', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ ticket_id, status })
                });
                loadTickets();
            } catch(e) {}
        }

        // Init
        if(section === 'chat') {
            fetchMessages();
            setInterval(fetchMessages, 5000); // Polling every 5s
        } else {
            loadTickets();
        }
    </script>
</body>
</html>
