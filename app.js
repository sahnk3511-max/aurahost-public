const toast = document.querySelector('#toast');
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 6000);
}

// Keep the existing public/demo page hidden. Visitors see sign-in first;
// authenticated users get a simple account dashboard.
document.body.classList.add('auth-pending');
document.querySelectorAll('.topbar, body > main, body > footer').forEach((el) => { el.hidden = true; });

const gate = document.createElement('main');
gate.id = 'auth-gate';
gate.className = 'auth-screen';
gate.innerHTML = `
  <section class="auth-card" aria-labelledby="login-title">
    <a class="brand auth-brand" href="#">✦ Aura<span>host</span></a>
    <div class="eyebrow"><span class="pulse"></span> مساحة مشاريعك</div>
    <h1 id="login-title">مرحبًا بك</h1>
    <p class="auth-description">سجّل الدخول أو أنشئ حسابًا برابط آمن يُرسل إلى بريدك الإلكتروني.</p>
    <form id="login-form">
      <label for="login-email">البريد الإلكتروني</label>
      <input id="login-email" type="email" autocomplete="email" required placeholder="name@example.com" dir="ltr">
      <button id="login-submit" class="button button-primary" type="submit">أرسل رابط الدخول</button>
    </form>
    <p id="login-status" class="auth-status" role="status" aria-live="polite">لن تحتاج إلى كلمة مرور.</p>
  </section>`;
document.body.prepend(gate);

const workspace = document.createElement('main');
workspace.id = 'workspace';
workspace.className = 'workspace wrap';
workspace.hidden = true;
workspace.innerHTML = `
  <header class="workspace-top">
    <a class="brand" href="#">✦ Aura<span>host</span></a>
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

// Persistent YouTube player: it stays mounted while switching between sign-in
// and the dashboard. Browsers may block autoplay with sound until the visitor
// interacts with the player, so its standard playback controls remain visible.
const music = document.createElement('aside');
music.className = 'music-player';
music.setAttribute('aria-label', 'مشغل الموسيقى');
music.innerHTML = `
  <div class="music-player-label">الأغنية</div>
  <iframe title="مشغل الأغنية" src="https://www.youtube-nocookie.com/embed/mCZkPHKSnK8?autoplay=1&playsinline=1&controls=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
  <small>إذا لم يبدأ التشغيل تلقائيًا، اضغط تشغيل.</small>`;
document.body.append(music);

const form = gate.querySelector('#login-form');
const emailInput = gate.querySelector('#login-email');
const submit = gate.querySelector('#login-submit');
const status = gate.querySelector('#login-status');
let supabaseClient;

function showLogin(message = '') {
  workspace.hidden = true;
  gate.hidden = false;
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
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    status.textContent = 'جارٍ تهيئة تسجيل الدخول. انتظر لحظة ثم حاول مرة أخرى.';
    return;
  }
  submit.disabled = true;
  submit.textContent = 'جارٍ إرسال الرابط…';
  status.textContent = '';
  try {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabaseClient.auth.signInWithOtp({
      email: emailInput.value.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo }
    });
    if (error) throw error;
    status.textContent = 'أرسلنا رابط الدخول إلى بريدك. افتحه للانتقال إلى لوحة التحكم، وتحقق من Spam/Junk إذا لم تجده.';
  } catch (error) {
    console.error('Email sign-in failed:', error);
    status.textContent = 'تعذر إرسال الرابط. تحقق من البريد وإعداد Redirect URLs في Supabase.';
  } finally {
    submit.disabled = false;
    submit.textContent = 'أرسل رابط الدخول';
  }
});

workspace.querySelector('#logout-button').addEventListener('click', async () => {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) showToast('تعذر تسجيل الخروج. حاول مرة أخرى.');
});
workspace.querySelector('#add-project-button').addEventListener('click', () => {
  showToast('إضافة وتشغيل البوتات تحتاج إعداد الخادم الخلفي؛ لم يتم تفعيلها في الموقع بعد.');
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
    await loadScript('auth-config.js');
    const config = window.AURAHOST_SUPABASE;
    const validUrl = config && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url);
    if (!validUrl || !config.anonKey || config.anonKey.includes('YOUR_')) {
      showLogin('إعداد Supabase غير مكتمل في auth-config.js.');
      return;
    }
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    if (!window.supabase?.createClient) throw new Error('Supabase library unavailable');
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (session) showWorkspace(session);
    else showLogin();
    supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) showWorkspace(nextSession);
      else showLogin();
    });
  } catch (error) {
    console.error('Supabase initialization failed:', error);
    showLogin('تعذر تحميل تسجيل الدخول. تحقق من الاتصال وإعداد Supabase.');
  }
})();
