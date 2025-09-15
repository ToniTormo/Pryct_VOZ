export default class ThemeManager {
    constructor() { this.root = document.documentElement; this.key = 'pryct_theme'; this._init(); }
    _init(){ const saved = localStorage.getItem(this.key); if (saved === 'light') document.documentElement.classList.add('theme-light'); }
    toggleTheme(){ const isLight = document.documentElement.classList.toggle('theme-light'); localStorage.setItem(this.key, isLight ? 'light' : 'dark'); document.getElementById('themeToggle').textContent = isLight ? '☀️' : '🌙'; }
}
