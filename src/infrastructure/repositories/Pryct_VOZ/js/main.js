document.addEventListener('DOMContentLoaded', (event) => {
  let theme = localStorage.getItem('theme');
  if (!theme) {
    theme = 'light';
  }
  document.body.setAttribute('data-theme', theme);
});

function toggleTheme() {
  let theme = document.body.getAttribute('data-theme');
  if (theme === 'light') {
    theme = 'dark';
  } else {
    theme = 'light';
  }
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}