(function () {
  const STORAGE_KEYS = {
    language: 'edumorphLanguage',
    fontSize: 'edumorphFontSize',
    highContrast: 'edumorphHighContrast',
    reduceMotion: 'edumorphReduceMotion'
  };

  function getPreference(key, fallback) {
    const value = localStorage.getItem(key);
    return value !== null ? value : fallback;
  }

  function setPreference(key, value) {
    localStorage.setItem(key, value);
  }

  function ensureSkipLink() {
    if (document.querySelector('.skip-link')) return;

    const skip = document.createElement('a');
    skip.href = '#main-content';
    skip.className = 'skip-link';
    skip.textContent = 'Μετάβαση στο κύριο περιεχόμενο';
    document.body.prepend(skip);
  }

  function ensureLiveRegion() {
    if (document.getElementById('aria-live-region')) return;

    const live = document.createElement('div');
    live.id = 'aria-live-region';
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  }

  function announce(message) {
    const live = document.getElementById('aria-live-region');
    if (!live) return;
    live.textContent = '';
    setTimeout(() => {
      live.textContent = message;
    }, 50);
  }

  function applyFontSize(mode) {
    document.body.classList.remove('accessibility-large', 'accessibility-xlarge');
    if (mode === 'large') document.body.classList.add('accessibility-large');
    if (mode === 'xlarge') document.body.classList.add('accessibility-xlarge');
  }

  function cycleFontSize() {
    const current = getPreference(STORAGE_KEYS.fontSize, 'normal');
    const next =
      current === 'normal' ? 'large' :
      current === 'large' ? 'xlarge' :
      'normal';

    setPreference(STORAGE_KEYS.fontSize, next);
    applyFontSize(next);
    announce(`Μέγεθος γραμματοσειράς: ${next}`);
    updateToolbarState();
  }

  function applyHighContrast(enabled) {
    document.body.classList.toggle('high-contrast', enabled === 'true');
  }

  function toggleHighContrast() {
    const current = getPreference(STORAGE_KEYS.highContrast, 'false');
    const next = current === 'true' ? 'false' : 'true';
    setPreference(STORAGE_KEYS.highContrast, next);
    applyHighContrast(next);
    announce(next === 'true' ? 'Υψηλή αντίθεση ενεργή' : 'Υψηλή αντίθεση ανενεργή');
    updateToolbarState();
  }

  function applyReduceMotion(enabled) {
    document.body.classList.toggle('reduce-motion', enabled === 'true');
  }

  function toggleReduceMotion() {
    const current = getPreference(STORAGE_KEYS.reduceMotion, 'false');
    const next = current === 'true' ? 'false' : 'true';
    setPreference(STORAGE_KEYS.reduceMotion, next);
    applyReduceMotion(next);
    announce(next === 'true' ? 'Μείωση κίνησης ενεργή' : 'Μείωση κίνησης ανενεργή');
    updateToolbarState();
  }

  function getCurrentLanguage() {
    return getPreference(STORAGE_KEYS.language, 'el');
  }

  function setLanguage(lang) {
    setPreference(STORAGE_KEYS.language, lang);
    document.documentElement.lang = lang;
    applyTranslations();
    announce(lang === 'el' ? 'Ελληνική γλώσσα ενεργή' : 'English language active');
    updateToolbarState();
  }

  function toggleLanguage() {
    const next = getCurrentLanguage() === 'el' ? 'en' : 'el';
    setLanguage(next);
  }

  function applyTranslations() {
    const lang = getCurrentLanguage();
    const translations = window.pageTranslations || {};
    const langDict = translations[lang] || {};

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent.trim();
      }

      if (lang === 'el') {
        el.textContent = translations.el && translations.el[key]
          ? translations.el[key]
          : el.dataset.originalText;
      } else if (langDict[key]) {
        el.textContent = langDict[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (!el.dataset.originalPlaceholder) {
        el.dataset.originalPlaceholder = el.getAttribute('placeholder') || '';
      }

      if (lang === 'el') {
        el.setAttribute(
          'placeholder',
          (translations.el && translations.el[key]) || el.dataset.originalPlaceholder
        );
      } else if (langDict[key]) {
        el.setAttribute('placeholder', langDict[key]);
      }
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.dataset.i18nAriaLabel;
      if (!el.dataset.originalAriaLabel) {
        el.dataset.originalAriaLabel = el.getAttribute('aria-label') || '';
      }

      if (lang === 'el') {
        el.setAttribute(
          'aria-label',
          (translations.el && translations.el[key]) || el.dataset.originalAriaLabel
        );
      } else if (langDict[key]) {
        el.setAttribute('aria-label', langDict[key]);
      }
    });
  }

  function buildToolbar() {
    if (document.querySelector('.a11y-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'a11y-toolbar';
    toolbar.innerHTML = `
      <button id="lang-toggle-btn" type="button" aria-label="Αλλαγή γλώσσας">GR / EN</button>
      <button id="font-toggle-btn" type="button" aria-label="Αλλαγή μεγέθους γραμματοσειράς">A±</button>
      <button id="contrast-toggle-btn" type="button" aria-label="Εναλλαγή υψηλής αντίθεσης">Contrast</button>
      <button id="motion-toggle-btn" type="button" aria-label="Εναλλαγή μείωσης κίνησης">Motion</button>
    `;

    const firstElement = document.body.firstElementChild;
    if (firstElement) {
      firstElement.insertAdjacentElement('beforebegin', toolbar);
    } else {
      document.body.prepend(toolbar);
    }

    document.getElementById('lang-toggle-btn').addEventListener('click', toggleLanguage);
    document.getElementById('font-toggle-btn').addEventListener('click', cycleFontSize);
    document.getElementById('contrast-toggle-btn').addEventListener('click', toggleHighContrast);
    document.getElementById('motion-toggle-btn').addEventListener('click', toggleReduceMotion);
  }

  function updateToolbarState() {
    const fontSize = getPreference(STORAGE_KEYS.fontSize, 'normal');
    const contrast = getPreference(STORAGE_KEYS.highContrast, 'false');
    const motion = getPreference(STORAGE_KEYS.reduceMotion, 'false');
    const lang = getCurrentLanguage();

    const langBtn = document.getElementById('lang-toggle-btn');
    const fontBtn = document.getElementById('font-toggle-btn');
    const contrastBtn = document.getElementById('contrast-toggle-btn');
    const motionBtn = document.getElementById('motion-toggle-btn');

    if (langBtn) langBtn.textContent = lang === 'el' ? 'GR / EN' : 'EN / GR';
    if (fontBtn) fontBtn.textContent =
      fontSize === 'normal' ? 'A±' :
      fontSize === 'large' ? 'A+' :
      'A++';

    if (contrastBtn) contrastBtn.classList.toggle('active-toggle', contrast === 'true');
    if (motionBtn) motionBtn.classList.toggle('active-toggle', motion === 'true');
  }

  function applySavedPreferences() {
    document.documentElement.lang = getCurrentLanguage();
    applyFontSize(getPreference(STORAGE_KEYS.fontSize, 'normal'));
    applyHighContrast(getPreference(STORAGE_KEYS.highContrast, 'false'));
    applyReduceMotion(getPreference(STORAGE_KEYS.reduceMotion, 'false'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureSkipLink();
    ensureLiveRegion();
    buildToolbar();
    applySavedPreferences();
    applyTranslations();
    updateToolbarState();
  });

  window.EduMorphUI = {
    announce,
    applyTranslations
  };
})();
