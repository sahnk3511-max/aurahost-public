const toast = document.querySelector('#toast');
let toastTimer;

document.querySelectorAll('[data-demo-action]').forEach((button) => {
  button.addEventListener('click', () => {
    // Demo only: no upload, execution, account creation, or network request.
    toast.textContent = 'هذه معاينة تجريبية فقط — لم يتم إنشاء مشروع أو تشغيل أي شيء.';
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
  });
});
