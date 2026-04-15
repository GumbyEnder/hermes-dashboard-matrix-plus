const form = document.getElementById('login-form');
const passwordInput = document.getElementById('pw');
const errorBox = document.getElementById('err');

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = 'block';
}

async function submitLogin(event) {
  event.preventDefault();
  errorBox.style.display = 'none';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: passwordInput.value }),
      credentials: 'same-origin',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showError(data.error || form.dataset.invalidPw || 'Invalid password');
      return;
    }

    window.location.href = '/';
  } catch {
    showError(form.dataset.connFailed || 'Connection failed');
  }
}

if (form && passwordInput && errorBox) {
  form.addEventListener('submit', submitLogin);
}
