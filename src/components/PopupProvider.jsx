import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertTriangle } from 'lucide-react';
import { setPopupApi } from '../utils/popup';

const getPortalRoot = () => {
  if (typeof document === 'undefined') return null;
  return document.fullscreenElement || document.body;
};

export default function PopupProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const [dialog, setDialog] = React.useState(null);
  const [promptValue, setPromptValue] = React.useState('');
  const resolverRef = React.useRef(null);

  const closeDialog = React.useCallback((result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    if (resolve) resolve(result);
  }, []);

  const toast = React.useCallback((message, opts = {}) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const durationMs = Number.isFinite(opts.durationMs) ? opts.durationMs : 2600;
    const variant = opts.variant || 'info';

    setToasts((prev) => [...prev, { id, message: String(message || ''), variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  }, []);

  const alert = React.useCallback((opts = {}) => {
    const o = { title: opts.title || 'Info', message: opts.message || '' };
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ type: 'alert', ...o });
    });
  }, []);

  const confirm = React.useCallback((opts = {}) => {
    const o = {
      title: opts.title || 'Konfirmasi',
      message: opts.message || '',
      confirmText: opts.confirmText || 'Ya',
      cancelText: opts.cancelText || 'Batal',
      danger: !!opts.danger,
    };
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ type: 'confirm', ...o });
    });
  }, []);

  const prompt = React.useCallback((opts = {}) => {
    const o = {
      title: opts.title || 'Input',
      message: opts.message || '',
      defaultValue: (opts.defaultValue ?? ''),
      placeholder: opts.placeholder || '',
      confirmText: opts.confirmText || 'Simpan',
      cancelText: opts.cancelText || 'Batal',
    };
    setPromptValue(String(o.defaultValue));
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ type: 'prompt', ...o });
    });
  }, []);

  React.useEffect(() => {
    const api = { toast, alert, confirm, prompt };
    setPopupApi(api);
    return () => setPopupApi(null);
  }, [toast, alert, confirm, prompt]);

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (!dialog) return;
      if (e.key !== 'Escape') return;
      if (dialog.type === 'alert') closeDialog(true);
      else closeDialog(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dialog, closeDialog]);

  const portalRoot = getPortalRoot();

  return (
    <>
      {children}

      {portalRoot && createPortal(
        <>
          <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`pointer-events-none px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold animate-fade-in-up ${
                  t.variant === 'success'
                    ? 'bg-emerald-600/90 border-emerald-300/30 text-white'
                    : t.variant === 'danger'
                      ? 'bg-rose-600/90 border-rose-300/30 text-white'
                      : 'bg-slate-900/90 border-white/10 text-white'
                }`}
              >
                {t.message}
              </div>
            ))}
          </div>

          {dialog && (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm">
              <div
                className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white/60 dark:border-slate-700/70 shadow-2xl overflow-hidden spatial-shadow"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`px-6 py-5 border-b ${
                  dialog.type !== 'alert' && dialog.danger
                    ? 'bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900 border-rose-100 dark:border-rose-900/30'
                    : 'bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900 border-slate-100 dark:border-slate-800'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner border ${
                        dialog.type !== 'alert' && dialog.danger
                          ? 'bg-rose-100 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">{dialog.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed whitespace-pre-line">
                          {dialog.message}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                      onClick={() => closeDialog(dialog.type === 'alert')}
                      title="Tutup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {dialog.type === 'prompt' && (
                  <div className="px-6 pt-5">
                    <input
                      autoFocus
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      placeholder={dialog.placeholder || ''}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white font-bold"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') closeDialog(promptValue);
                      }}
                    />
                  </div>
                )}

                <div className="px-6 py-5 flex gap-2 justify-end">
                  {dialog.type !== 'alert' && (
                    <button
                      type="button"
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black cursor-pointer"
                      onClick={() => closeDialog(dialog.type === 'prompt' ? null : false)}
                    >
                      {dialog.cancelText || 'Batal'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`px-4 py-2.5 rounded-xl text-sm font-black cursor-pointer flex items-center gap-2 ${
                      dialog.type !== 'alert' && dialog.danger
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    onClick={() => {
                      if (dialog.type === 'alert') closeDialog(true);
                      else if (dialog.type === 'confirm') closeDialog(true);
                      else closeDialog(promptValue);
                    }}
                  >
                    <Check className="w-4 h-4" /> {dialog.confirmText || 'OK'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        portalRoot
      )}
    </>
  );
}

