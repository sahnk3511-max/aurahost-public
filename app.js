const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 5000);
}

document.querySelectorAll('[data-demo-action]').forEach((button) => {
  button.addEventListener('click', () => {
    showToast('إدارة الحساب متاحة، أما تشغيل البوتات فيحتاج إعداد خادم الاستضافة لاحقًا.');
  });
});

// Supabase passwordless email OTP. This becomes active after auth-config.js
// is filled with the project's public URL and publishable/anon key.
const config = window.AURAHOST_SUPABASE;
const isConfigured = config &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url) &&
  config.anonKey &&
  !config.anonKey.includes('YOUR_');
const topbar = document.querySelector('.topbar');

if (topbar) {
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
    <p id="auth-help" style="color:#aaa;margin:0 0 18px;font-size:14px">اكتب بريدك الإلكتروني وسنرسل لك رمز تحقق.</p>
    <form id="auth-form">
      <label for="auth-email" style="display:block;margin-bottom:6px">البريد الإلكتروني</label>
      <input id="auth-email" type="email" autocomplete="email" required placeholder="name@example.com" style="width:100%;padding:12px;border:1px solid #45435c;border-radius:10px;background:#090914;color:#fff;font:inherit;direction:ltr">
      <div id="otp-wrap" hidden style="margin-top:14px">
        <label for="auth-otp" style="display:block;margin-bottom:6px">رمز التحقق</label>
        <input id="auth-otp" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="123456" style="width:100%;padding:12px;border:1px solid #45435c;border-radius:10px;background:#090914;color:#fff;font:inherit;letter-spacing:.25em;text-align:center">
      </div>
      <button id="auth-submit" class="button button-primary" type="submit" style="width:100%;margin-top:18px">إرسال رمز التحقق</button>
      <button id="auth-back" type="button" hidden style="display:block;margin:12px auto 0;border:0;background:none;color:#bda4ff;cursor:pointer;font:inherit">تغيير البريد</button>
    </form>
    <p style="color:#89879c;font-size:12px;margin:16px 0 0">لن نطلب كلمة مرورك. لا تشارك رمز التحقق مع أحد.</p>`;
  document.body.append(modal);

  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'button button-small button-primary';
  openButton.textContent = 'دخول / إنشاء حساب';
  openButton.addEventListener('click', () => {
    if (!isConfigured) {
      showToast('يلزم ربط Supabase أولًا: أضف Project URL وPublishable/anon key في auth-config.js. راجع SUPABASE_SETUP.md.');
      return;
    }
    modal.showModal();
  });
  authArea.append(openButton);

  const emailInput = modal.querySelector('#auth-email');
  const otpWrap = modal.querySelector('#otp-wrap');
  const otpInput = modal.querySelector('#auth-otp');
  const submitButton = modal.querySelector('#auth-submit');
  const backButton = modal.querySelector('#auth-back');
  const help = modal.querySelector('#auth-help');
  let supabaseClient;
  let waitingForOtp = false;

  function setBusy(busy) {
    submitButton.disabled = busy;
    submitButton.style.opacity = busy ? '.65' : '1';
    submitButton.textContent = busy ? 'لحظة من فضلك…' : (waitingForOtp ? 'تحقق من الرمز' : 'إرسال رمز التحقق');
  }

  function resetOtp() {
    waitingForOtp = false;
    otpWrap.hidden = true;
    otpInput.required = false;
    otpInput.value = '';
    emailInput.readOnly = false;
    backButton.hidden = true;
    help.textContent = 'اكتب بريدك الإلكتروني وسنرسل لك رمز تحقق.';
    setBusy(false);
  }

  backButton.addEventListener('click', resetOtp);

  modal.querySelector('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      showToast('تعذر الاتصال بخدمة الحسابات. راجع إعداد Supabase واتصال الإنترنت.');
      return;
    }
    const email = emailInput.value.trim();
    setBusy(true);
    try {
      if (!waitingForOtp) {
        const { error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true }
        });
        if (error) throw error;
        waitingForOtp = true;
        otpWrap.hidden = false;
        otpInput.required = true;
        emailInput.readOnly = true;
        backButton.hidden = false;
        help.textContent = 'أرسلنا رمزًا إلى بريدك. أدخله هنا لإكمال إنشاء الحساب أو تسجيل الدخول.';
        showToast('تحقق من بريدك الإلكتروني، بما في ذلك مجلد الرسائل غير المرغوب فيها.');
      } else {
        const { error } = await supabaseClient.auth.verifyOtp({
          email,
          token: otpInput.value.trim(),
          type: 'email'
        });
        if (error) throw error;
        modal.close();
        resetOtp();
      }
    } catch (error) {
      console.error('Email authentication failed:', error);
      showToast(waitingForOtp ? 'تعذر التحقق من الرمز. تأكد أنه صحيح وغير منتهي.' : 'تعذر إرسال الرمز. تحقق من البريد وإعدادات البريد في Supabase.');
    } finally {
      setBusy(false);
    }
  });

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

  if (isConfigured) {
    const supabaseScript = document.createElement('script');
    supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    supabaseScript.async = true;
    supabaseScript.onload = async () => {
      if (!window.supabase?.createClient) {
        showToast('تعذر تحميل خدمة الحسابات.');
        return;
      }
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      const { data: { session } } = await supabaseClient.auth.getSession();
      renderSession(session);
      supabaseClient.auth.onAuthStateChange((_event, nextSession) => renderSession(nextSession));
    };
    supabaseScript.onerror = () => showToast('تعذر تحميل مكتبة تسجيل الدخول. تحقق من اتصالك.');
    document.head.append(supabaseScript);
  }
}
