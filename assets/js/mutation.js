// Mutation Management Functions

function openMutationModal(agentId) {
    document.getElementById('mutation-target-agent-id').value = agentId;
    document.getElementById('modal-mutation').style.display = 'flex';
}

async function submitMutation() {
    const aid = document.getElementById('mutation-target-agent-id').value;
    const dest = document.getElementById('mutation-destination').value;
    const start = document.getElementById('mutation-start').value;
    const end = document.getElementById('mutation-end').value;

    if (!dest || !start || !end) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;

    try {
        const res = await fetch('api.php?action=apply_mutation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agent_id: aid,
                start_date: start,
                end_date: end,
                destination: dest,
                period: periodStr,
                shift_code: 'J'
            })
        });
        const data = await res.json();
        if (data.success) {
            closeModals();
            loadSiteData(currentSiteId);
        } else {
            alert(data.message);
        }
    } catch (e) {
        console.error("Mutation error:", e);
    }
}

async function clearMutation(agentId, date, shift) {
    if (!confirm("Voulez-vous supprimer cette mutation ?")) return;

    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
    await fetch('api.php?action=update_attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            agent_id: agentId,
            date: date,
            shift_code: shift,
            status: '',
            period: periodStr
        })
    });
    loadSiteData(currentSiteId);
}
