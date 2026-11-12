const toast = document.querySelector('#toast');
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 6000);
}

document.body.classList.add('auth-pending');
document.querySelectorAll('.topbar, body > main, body > footer').forEach((element) => {
  element.hidden = true;
});

const gate = document.createElement('main');
gate.id = 'auth-gate';
gate.className = 'auth-screen';
gate.innerHTML = `
  <section class="auth-card" aria-labelledby="login-title">
    <a class="brand auth-brand" href="#">Aura<span>host</span></a>
    <h1 id="login-title">إنشاء حساب</h1>
    <p id="auth-description" class="auth-description">أنشئ حسابك ببريدك الإلكتروني وكلمة المرور، ثم استخدمهما لتسجيل الدخول لاحقًا.</p>
    <form id="login-form">
      <label for="login-email">البريد الإلكتروني</label>
      <input id="login-email" type="email" autocomplete="email" required placeholder="name@example.com" dir="ltr">
      <label for="login-password">كلمة المرور</label>
      <input id="login-password" type="password" autocomplete="new-password" minlength="8" required placeholder="8 أحرف على الأقل" dir="ltr">
      <button id="login-submit" class="button button-primary" type="submit">إنشاء حساب</button>
    </form>
    <p class="auth-switch"><span id="switch-prompt">لديك حساب؟</span> <button id="switch-mode" type="button">تسجيل الدخول</button></p>
    <p id="login-status" class="auth-status" role="status" aria-live="polite"></p>
  </section>`;
document.body.prepend(gate);

const workspace = document.createElement('main');
workspace.id = 'workspace';
workspace.className = 'workspace wrap';
workspace.hidden = true;
workspace.innerHTML = `
  <header class="workspace-top">
    <a class="brand" href="#">Aura<span>host</span></a>
    <div class="workspace-account"><span id="account-email"></span><button id="logout-button" class="button button-small button-quiet" type="button">تسجيل الخروج</button></div>
  </header>
  <section class="workspace-welcome">
    <div class="eyebrow"><span class="pulse"></span> لوحة التحكم</div>
    <h1>أهلًا بك <span class="gradient" id="account-name"></span></h1>
    <p>هذه مساحة حسابك. ستظهر مشاريعك هنا.</p>
  </section>
  <section class="workspace-panel">
    <div class="workspace-panel-head"><div><h2>مشاريعي</h2><p>إدارة مشاريعك من مكان واحد</p></div><button id="add-project-button" class="button button-primary" type="button">＋ إضافة مشروع</button></div>
    <div class="workspace-empty"><span class="empty-icon">✦</span><h3>مساحتك جاهزة</h3><p>تسجيل الدخول يعمل. إنشاء البوتات وتشغيلها يحتاج ربط خادم خلفي آمن؛ الموقع الحالي لا يشغّل بوتات بعد.</p></div>
  </section>`;
document.body.append(workspace);

const music = document.createElement('aside');
music.className = 'music-player';
music.hidden = true;
music.setAttribute('aria-label', 'مشغل الموسيقى');
music.innerHTML = `<div class="music-player-label">الأغنية</div><iframe title="مشغل الأغنية" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><small>إذا لم يبدأ تلقائيًا، اضغط تشغيل.</small>`;
document.body.append(music);
let musicStarted = false;
function startMusicAfterLogin() {
  music.hidden = false;
  if (musicStarted) return;
  musicStarted = true;
  music.querySelector('iframe').src = 'https://www.youtube-nocookie.com/embed/mCZkPHKSnK8?autoplay=1&playsinline=1&controls=1&rel=0';
}

const form = gate.querySelector('#login-form');
const emailInput = gate.querySelector('#login-email');
const passwordInput = gate.querySelector('#login-password');
const submit = gate.querySelector('#login-submit');
const status = gate.querySelector('#login-status');
const switchModeButton = gate.querySelector('#switch-mode');
let isExistingAccountLogin = false;
let supabaseClient;

switchModeButton.addEventListener('click', () => {
  isExistingAccountLogin = !isExistingAccountLogin;
  gate.querySelector('#login-title').textContent = isExistingAccountLogin ? 'تسجيل الدخول' : 'إنشاء حساب';
  gate.querySelector('#auth-description').textContent = isExistingAccountLogin
    ? 'أدخل بريدك الإلكتروني وكلمة المرور للدخول إلى حسابك.'
    : 'أنشئ حسابك ببريدك الإلكتروني وكلمة المرور، ثم استخدمهما لتسجيل الدخول لاحقًا.';
  gate.querySelector('#switch-prompt').textContent = isExistingAccountLogin ? 'ليس لديك حساب؟' : 'لديك حساب؟';
  switchModeButton.textContent = isExistingAccountLogin ? 'إنشاء حساب' : 'تسجيل الدخول';
  submit.textContent = isExistingAccountLogin ? 'تسجيل الدخول' : 'إنشاء حساب';
  passwordInput.autocomplete = isExistingAccountLogin ? 'current-password' : 'new-password';
  status.textContent = '';
});

function showLogin(message = '') {
  workspace.hidden = true;
  gate.hidden = false;
  music.hidden = true;
  document.body.classList.add('auth-ready');
  document.body.classList.remove('auth-pending');
  if (message) status.textContent = message;
}
function showWorkspace(session) {
  if (!session?.user) return showLogin();
  gate.hidden = true;
  workspace.hidden = false;
  document.body.classList.add('auth-ready');
  document.body.classList.remove('auth-pending');
  const email = session.user.email || '';
  workspace.querySelector('#account-email').textContent = email;
  workspace.querySelector('#account-name').textContent = email ? `، ${email}` : '';
  startMusicAfterLogin();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    status.textContent = 'جارٍ تهيئة تسجيل الدخول. انتظر لحظة ثم حاول مرة أخرى.';
    return;
  }
  submit.disabled = true;
  submit.textContent = 'جارٍ التحقق…';
  status.textContent = '';
  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (isExistingAccountLogin) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) showWorkspace(data.session);
    } else {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        showWorkspace(data.session);
      } else {
        status.textContent = 'الحساب أُنشئ لكن Supabase يطلب تأكيد البريد. لتعطيل الرسائل، أوقف Confirm email من إعدادات Authentication في Supabase.';
      }
    }
  } catch (error) {
    console.error('Supabase authentication error:', error);
    status.textContent = `تعذر ${isExistingAccountLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}: ${error.message || 'خطأ غير معروف'}`;
  } finally {
    submit.disabled = false;
    submit.textContent = isExistingAccountLogin ? 'تسجيل الدخول' : 'إنشاء حساب';
  }
});

workspace.querySelector('#logout-button').addEventListener('click', async () => {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) showToast(`تعذر تسجيل الخروج: ${error.message || 'حاول مرة أخرى.'}`);
});
workspace.querySelector('#add-project-button').addEventListener('click', () => {
  showToast('إضافة وتشغيل البوتات تحتاج إعداد خادم خلفي؛ لم يتم تفعيلها بعد.');
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`تعذر تحميل ${src}`));
    document.head.append(script);
  });
}

(async () => {
  try {
    await loadScript('auth-config.js');
    const config = window.AURAHOST_SUPABASE;
    const validUrl = config && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url);
    if (!validUrl || !config.anonKey || config.anonKey.includes('YOUR_')) {
      showLogin('إعداد Supabase غير مكتمل في auth-config.js.');
      return;
    }
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    if (!window.supabase?.createClient) throw new Error('لم يتم تحميل مكتبة Supabase');
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (data.session) showWorkspace(data.session);
    else showLogin();
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session) showWorkspace(session);
      else showLogin();
    });
  } catch (error) {
    console.error('Supabase initialization error:', error);
    showLogin(`تعذر تحميل تسجيل الدخول: ${error.message || 'تحقق من الاتصال وإعداد Supabase.'}`);
  }
})();
