const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 6000);
}

document.querySelectorAll('[data-demo-action]').forEach((button) => {
  button.addEventListener('click', () => {
    showToast('إدارة الحساب متاحة، أما تشغيل البوتات فيحتاج إعداد خادم الاستضافة لاحقًا.');
  });
});

const topbar = document.querySelector('.topbar');
if (!topbar) return;

const authArea = document.createElement('div');
authArea.id = 'auth-area';
authArea.style.cssText = 'display:flex;align-items:center;gap:10px;margin-inline-start:auto';
topbar.append(authArea);

const modal = document.createElement('dialog');
modal.dir = 'rtl';
modal.setAttribute('aria-labelledby', 'auth-title');
modal.style.cssText = 'width:min(420px,calc(100% - 32px));border:1px solid #38364f;border-radius:18px;background:#11111e;color:#f4f3fc;padding:26px;box-shadow:0 24px 80px #000b;font-family:inherit';
modal.innerHTML = `
  <form method="dialog" style="text-align:left"><button aria-label="إغلاق" style="background:none;border:0;color:#aaa;font-size:24px;cursor:pointer">×</button></form>
  <h2 id="auth-title" style="margin:0 0 8px;font-size:22px">حسابك في AuraHost</h2>
  <p id="auth-help" style="color:#aaa;margin:0 0 18px;font-size:14px">اكتب بريدك الإلكتروني وسنرسل لك رابط دخول آمن.</p>
  <form id="auth-form">
    <label for="auth-email" style="display:block;margin-bottom:6px">البريد الإلكتروني</label>
    <input id="auth-email" type="email" autocomplete="email" required placeholder="name@example.com" style="width:100%;padding:12px;border:1px solid #45435c;border-radius:10px;background:#090914;color:#fff;font:inherit;direction:ltr">
    <button id="auth-submit" class="button button-primary" type="submit" style="width:100%;margin-top:18px">إرسال رابط الدخول</button>
  </form>
  <p style="color:#89879c;font-size:12px;margin:16px 0 0">افتح الرابط الذي يصلك على بريدك. لا تشاركه مع أحد.</p>`;
document.body.append(modal);

const openButton = document.createElement('button');
openButton.type = 'button';
openButton.className = 'button button-small button-primary';
openButton.textContent = 'دخول / إنشاء حساب';
openButton.addEventListener('click', () => modal.showModal());
authArea.append(openButton);

const emailInput = modal.querySelector('#auth-email');
const submitButton = modal.querySelector('#auth-submit');
const help = modal.querySelector('#auth-help');
let supabaseClient;

function renderSession(session) {
  authArea.replaceChildren();
  if (!session?.user) {
    authArea.append(openButton);
    return;
  }
  const emailLabel = document.createElement('span');
  emailLabel.textContent = session.user.email || 'حسابي';
  emailLabel.title = 'تم تسجيل الدخول';
  emailLabel.style.cssText = 'color:#e9e7f5;font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const logout = document.createElement('button');
  logout.type = 'button';
  logout.className = 'button button-small button-quiet';
  logout.textContent = 'خروج';
  logout.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) showToast('تعذر تسجيل الخروج. حاول مرة أخرى.');
  });
  authArea.append(emailLabel, logout);
}

modal.querySelector('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    showToast('خدمة الحسابات لم تكتمل تهيئتها. حدّث الصفحة بعد قليل.');
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = 'جارٍ إرسال الرابط…';
  try {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabaseClient.auth.signInWithOtp({
      email: emailInput.value.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo }
    });
    if (error) throw error;
    help.textContent = 'أرسلنا رابط الدخول إلى بريدك. افتحه لإكمال تسجيل الدخول، وتحقق من Spam/Junk إذا لم تجده.';
    showToast('تم إرسال رابط الدخول إلى بريدك الإلكتروني.');
  } catch (error) {
    console.error('Email authentication failed:', error);
    showToast('تعذر إرسال رابط الدخول. تحقق من البريد وإعدادات Supabase.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'إرسال رابط الدخول';
  }
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

(async () => {
  try {
    // Load the public project configuration before initializing authentication.
    await loadScript('auth-config.js');
    const config = window.AURAHOST_SUPABASE;
    const validUrl = config && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url);
    if (!validUrl || !config.anonKey || config.anonKey.includes('YOUR_')) {
      showToast('إعداد Supabase غير مكتمل في auth-config.js.');
      return;
    }
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    if (!window.supabase?.createClient) throw new Error('Supabase library unavailable');
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    renderSession(session);
    supabaseClient.auth.onAuthStateChange((_event, nextSession) => renderSession(nextSession));
  } catch (error) {
    console.error('Supabase initialization failed:', error);
    showToast('تعذر تحميل تسجيل الدخول. تحقق من إعداد Supabase واتصال الإنترنت.');
  }
})();
