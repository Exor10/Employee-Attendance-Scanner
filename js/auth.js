// js/auth.js
// authentication for password hash for admin panel.

async function requireAdminAuth(){
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(CONFIG.API_BASE_URL + '?action = ping'); // check api if available
        // token verification apps script side
        const verify = await.fetch(CONFIG.API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'verifyToken', token: token})
        });

        const data = await.verify.json();
        if (!data.valid) {
            sessionStorage.removeItem('adminToken');
            window.location.href = 'login.html';
        }
    } catch(e){
        // if network fails trust stored token (if available offline)..
    }
        function adminLogout(){
            sessionStorage.removeItem('admin_token');
            window.location.href = 'login.html';
        }
}