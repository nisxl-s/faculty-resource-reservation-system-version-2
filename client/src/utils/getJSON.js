export async function getJSON(url) {
  const token = localStorage.getItem('token');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { credentials: 'include', signal: controller.signal, headers: token ? { Authorization: 'Bearer ' + token } : {} });
    if (!response.ok) throw new Error('Request failed (' + response.status + ')');
    return await response.json();
  } finally { clearTimeout(timeout); }
}
