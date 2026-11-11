const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
}

document.querySelectorAll('[data-demo-action]').forEach((button) => {
  button.addEventListener('click', () => {
    showToast('هذه معاينة فقط — لم يتم إنشاء مشروع أو تشغيل أي بوت.');
  });
});

// Google sign-in for this static demo. The ID token is not sent to a server,
// stored, or treated as verified authentication; a backend must verify it
// before protecting accounts or allowing privileged actions.
const GOOGLE_CLIENT_ID = '652467988256-1k9as53j5iia31lfib2rjle3vto1sqib.apps.googleusercontent.com';
const topbar = document.querySelector('.topbar');

if (topbar && GOOGLE_CLIENT_ID) {
  const loginArea = document.createElement('div');
  loginArea.id = 'google-login-area';
  loginArea.style.cssText = 'display:flex;align-items:center;gap:10px;margin-inline-start:auto';
  topbar.append(loginArea);

  function decodeJwtPayload(token) {
    const part = token.split('.')[1];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function showSignedInUser(credential) {
    // Decode only for display. This does not verify Google's signature.
    let profile;
    try {
      profile = decodeJwtPayload(credential);
    } catch {
      showToast('تعذر قراءة بيانات تسجيل الدخول. حاول مرة أخرى.');
      return;
    }

    loginArea.replaceChildren();
    const label = document.createElement('span');
    label.textContent = `أهلًا ${profile.name || 'بك'} — دخول للمعاينة`;
    label.style.cssText = 'color:#e9e7f5;font-size:13px';
    loginArea.append(label);

    const logout = document.createElement('button');
    logout.type = 'button';
    logout.textContent = 'تسجيل الخروج';
    logout.style.cssText = 'border:1px solid #625b80;border-radius:10px;background:transparent;color:#fff;padding:8px 12px;cursor:pointer;font:inherit';
    logout.addEventListener('click', () => {
      if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
      renderGoogleButton();
      showToast('تم تسجيل الخروج من واجهة المعاينة.');
    });
    loginArea.append(logout);
    showToast('تم تسجيل الدخول للمعاينة فقط؛ الموقع لا ينشئ حسابًا ولا يشغّل بوتات.');
  }

  function renderGoogleButton() {
    if (!window.google?.accounts?.id) return;
    loginArea.replaceChildren();
    const buttonHost = document.createElement('div');
    buttonHost.id = 'google-signin-button';
    loginArea.append(buttonHost);
    window.google.accounts.id.renderButton(buttonHost, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      locale: 'ar',
      logo_alignment: 'left'
    });
  }

  function initializeGoogleSignIn() {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response?.credential) showSignedInUser(response.credential);
        else showToast('لم يكتمل تسجيل الدخول بحساب Google.');
      }
    });
    renderGoogleButton();
  }

  const googleScript = document.createElement('script');
  googleScript.src = 'https://accounts.google.com/gsi/client';
  googleScript.async = true;
  googleScript.defer = true;
  googleScript.onload = initializeGoogleSignIn;
  googleScript.onerror = () => showToast('تعذر تحميل تسجيل الدخول من Google. تحقق من اتصالك.');
  document.head.append(googleScript);
}
