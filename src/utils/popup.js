let popupApi = null;

export function setPopupApi(nextApi) {
  popupApi = nextApi;
}

function normalizeText(input) {
  if (!input) return '';
  if (typeof input === 'string') return input;
  if (typeof input?.message === 'string') return input.message;
  return String(input);
}

export function prodifyToast(message, opts = {}) {
  if (popupApi?.toast) return popupApi.toast(message, opts);
  console.log('[Prodify Toast]', normalizeText(message));
}

export function prodifyAlert(opts) {
  const o = (typeof opts === 'string') ? { title: 'Info', message: opts } : (opts || {});
  if (popupApi?.alert) return popupApi.alert(o);
  return fallbackDialog({ type: 'alert', title: o.title || 'Info', message: normalizeText(o.message) }).then(() => undefined);
}

export function prodifyConfirm(opts) {
  const o = (typeof opts === 'string') ? { title: 'Konfirmasi', message: opts } : (opts || {});
  if (popupApi?.confirm) return popupApi.confirm(o);
  return fallbackDialog({ type: 'confirm', title: o.title || 'Konfirmasi', message: normalizeText(o.message) }).then((v) => !!v);
}

export function prodifyPrompt(opts) {
  const o = (opts || {});
  if (popupApi?.prompt) return popupApi.prompt(o);
  return fallbackDialog({
    type: 'prompt',
    title: o.title || 'Input',
    message: normalizeText(o.message),
    defaultValue: o.defaultValue || '',
    placeholder: o.placeholder || '',
  });
}

function fallbackDialog({ type, title, message, defaultValue = '', placeholder = '' }) {
  try {
    if (typeof document === 'undefined') {
      if (type === 'confirm') return Promise.resolve(false);
      if (type === 'prompt') return Promise.resolve(null);
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '2147483647';
      overlay.style.background = 'rgba(15, 23, 42, 0.55)';
      overlay.style.backdropFilter = 'blur(8px)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '16px';

      const card = document.createElement('div');
      card.style.width = '100%';
      card.style.maxWidth = '420px';
      card.style.background = 'rgba(255, 255, 255, 0.96)';
      card.style.borderRadius = '20px';
      card.style.boxShadow = '0 30px 80px rgba(0,0,0,0.28)';
      card.style.border = '1px solid rgba(148,163,184,0.35)';
      card.style.padding = '18px';
      card.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
      card.style.color = '#0f172a';

      const h = document.createElement('div');
      h.textContent = title || (type === 'confirm' ? 'Konfirmasi' : 'Info');
      h.style.fontWeight = '800';
      h.style.fontSize = '16px';
      h.style.marginBottom = '8px';

      const p = document.createElement('div');
      p.textContent = message || '';
      p.style.fontWeight = '600';
      p.style.fontSize = '13px';
      p.style.lineHeight = '1.45';
      p.style.color = '#334155';
      p.style.whiteSpace = 'pre-wrap';
      p.style.wordBreak = 'break-word';

      const inputWrap = document.createElement('div');
      inputWrap.style.marginTop = '12px';
      inputWrap.style.display = type === 'prompt' ? 'block' : 'none';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = defaultValue;
      input.placeholder = placeholder;
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '12px';
      input.style.border = '1px solid rgba(148,163,184,0.5)';
      input.style.outline = 'none';
      input.style.fontSize = '14px';
      input.style.fontWeight = '700';
      input.style.color = '#0f172a';
      inputWrap.appendChild(input);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '10px';
      actions.style.marginTop = '14px';

      const btnCancel = document.createElement('button');
      btnCancel.type = 'button';
      btnCancel.textContent = type === 'alert' ? 'Tutup' : 'Batal';
      btnCancel.style.flex = '1';
      btnCancel.style.padding = '10px 12px';
      btnCancel.style.borderRadius = '12px';
      btnCancel.style.border = '1px solid rgba(148,163,184,0.35)';
      btnCancel.style.background = 'rgba(241,245,249,0.95)';
      btnCancel.style.color = '#475569';
      btnCancel.style.fontWeight = '800';
      btnCancel.style.cursor = 'pointer';

      const btnOk = document.createElement('button');
      btnOk.type = 'button';
      btnOk.textContent = type === 'confirm' ? 'Ya' : 'OK';
      btnOk.style.flex = '1';
      btnOk.style.padding = '10px 12px';
      btnOk.style.borderRadius = '12px';
      btnOk.style.border = '1px solid rgba(79,70,229,0.35)';
      btnOk.style.background = 'rgba(79,70,229,0.92)';
      btnOk.style.color = '#ffffff';
      btnOk.style.fontWeight = '900';
      btnOk.style.cursor = 'pointer';

      const cleanup = () => {
        try { document.removeEventListener('keydown', onKey); } catch { }
        try { overlay.remove(); } catch { }
      };

      const resolveCancel = () => {
        cleanup();
        if (type === 'alert') resolve(true);
        else if (type === 'confirm') resolve(false);
        else resolve(null);
      };

      const resolveOk = () => {
        cleanup();
        if (type === 'prompt') resolve(input.value);
        else resolve(true);
      };

      const onKey = (e) => {
        if (e.key === 'Escape') resolveCancel();
        if (e.key === 'Enter') resolveOk();
      };

      btnCancel.addEventListener('click', resolveCancel);
      btnOk.addEventListener('click', resolveOk);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) resolveCancel(); });
      document.addEventListener('keydown', onKey);

      card.appendChild(h);
      card.appendChild(p);
      card.appendChild(inputWrap);

      if (type === 'alert') {
        actions.appendChild(btnOk);
      } else {
        actions.appendChild(btnCancel);
        actions.appendChild(btnOk);
      }
      card.appendChild(actions);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      if (type === 'prompt') {
        setTimeout(() => { try { input.focus(); input.select(); } catch { } }, 0);
      } else {
        setTimeout(() => { try { btnOk.focus(); } catch { } }, 0);
      }
    });
  } catch (e) {
    console.warn('[Prodify Popup] fallbackDialog failed:', e);
    if (type === 'confirm') return Promise.resolve(false);
    if (type === 'prompt') return Promise.resolve(null);
    return Promise.resolve(true);
  }
}
