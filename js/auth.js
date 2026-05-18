function requireAdminAuth() {
  const token = sessionStorage.getItem('admin_token');
  if (!token) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace('login.html?redirect=' + redirect);
  }
}

function adminLogout() {
  sessionStorage.removeItem('admin_token');
  window.location.href = 'login.html';
}
