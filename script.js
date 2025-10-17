document.addEventListener('DOMContentLoaded', () => {
  const loginBox = document.getElementById('loginBox');
  if (loginBox) {
    loginBox.addEventListener('click', () => {
      window.location.href = 'splash.html';
    });
  }
});
