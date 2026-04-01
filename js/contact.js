/**
 * Contact Form — Validation & submission
 */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const status = document.getElementById('form-status');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('#name').value.trim();
      const email = form.querySelector('#email').value.trim();
      const message = form.querySelector('#message').value.trim();

      // Validation
      if (!name || !email || !message) {
        showStatus('请填写所有字段', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showStatus('请输入有效的邮箱地址', 'error');
        return;
      }

      // Simulate submission (replace with real endpoint)
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = '发送中...';
      btn.disabled = true;

      setTimeout(() => {
        showStatus('消息已发送！感谢您的联系 🎉', 'success');
        form.reset();
        btn.textContent = originalText;
        btn.disabled = false;

        // Auto-hide status
        setTimeout(() => {
          if (status) {
            status.style.display = 'none';
            status.className = 'form-status';
          }
        }, 5000);
      }, 1500);
    });

    function showStatus(msg, type) {
      if (!status) return;
      status.textContent = msg;
      status.className = `form-status ${type}`;
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  });
})();
