import { prodifyAlert } from './popup';
export function getJson(key, fallback) {
    try {
        const isDemoMode = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true';
        const storageOptions = isDemoMode ? window.sessionStorage : localStorage;
        const raw = storageOptions.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        console.warn(`[Prodify Storage] Gagal parsing key: ${key}, data mungkin rusak. Menggunakan default.`, e);
        return fallback;
    }
}

export function dispatchProdifySync(key) {
    try {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('prodify-sync', { detail: { key } }));
    } catch {
        try {
            window.dispatchEvent(new Event('prodify-sync'));
        } catch {
        }
    }
}

export function setJson(key, value) {
    try {
        const isDemoMode = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true';
        const storageOptions = isDemoMode ? window.sessionStorage : localStorage;
        storageOptions.setItem(key, JSON.stringify(value));
        dispatchProdifySync(key);
    } catch (e) {
        console.error(`[Prodify Storage] Quota penuh atau error saat menyimpan: ${key}`, e);
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            prodifyAlert({
                title: 'Penyimpanan Lokal Penuh',
                message: "Harap lakukan backup data di menu Pengaturan dan hapus catatan (Whiteboard) yang sudah tidak terpakai.",
            });
        }
    }
}

export function getLocalDateKey(dateObj = new Date()) {
    const d = new Date(dateObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
}

export function getStorageUsageMB() {
    try {
        let total = 0;
        for (let x in localStorage) {
            if (!Object.prototype.hasOwnProperty.call(localStorage, x)) continue;
            total += ((localStorage[x].length + x.length) * 2);
        }
        return (total / 1024 / 1024).toFixed(2);
    } catch (e) {
        console.error("[Prodify Storage] Gagal menghitung kuota:", e);
        return "0.00";
    }
}
