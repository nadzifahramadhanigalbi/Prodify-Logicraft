import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Layout, FilePlus, FileText, Trash2, Bold, Italic, List, ListOrdered,
  Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2,
  Quote, Edit2, X, Check, Maximize2, Minimize2, Image as ImageIcon, Type,
  RemoveFormatting, CheckSquare, Printer, PenTool, Eraser, Palette, ArrowLeftRight,
  PaintBucket, Link, Undo, Redo, Target, ChevronRight, Zap
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { NekoMascotMini } from './NekoMascot';
import { getJson, setJson } from '../utils/storage';
import { prodifyAlert, prodifyPrompt } from '../utils/popup';

const ZenNotes = () => {
  const [pages, setPages] = useState(() => {
    const saved = getJson('zen_pages_multi', null);
    return saved ? saved : [{ id: 1, title: 'Ide Proyek Akhir', content: '', drawingData: null }];
  });

  const [activePageId, setActivePageId] = useState(() => {
    const parsed = getJson('zen_pages_multi', null);
    return parsed && parsed.length > 0 ? parsed[0].id : 1;
  });

  const [saveStatus, setSaveStatus] = useState('Tersimpan Otomatis');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [showTaskPopup, setShowTaskPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const [noteMode, setNoteMode] = useState('text');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageOrientation, setPageOrientation] = useState('potrait');
  const [lineSpacing, setLineSpacing] = useState('leading-relaxed');
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentFontSize, setCurrentFontSize] = useState('3');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    const settings = getJson('prodify_settings', {});
    return settings.autoSaveNotes !== false;
  });
  const [showProjectPanel, setShowProjectPanel] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const pendingDrawRef = useRef(null);
  const [drawColor, setDrawColor] = useState('black');
  const [lineWidth, setLineWidth] = useState(4);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showDrawCursor, setShowDrawCursor] = useState(false);
  const activePage = pages.find(p => p.id === activePageId);

  const wordCount = useMemo(() => {
    const html = activePage?.content || '';
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }, [activePage?.content]);

  useEffect(() => {
    const loadProjectTasks = () => {
      const allTasks = getJson('matrix_tasks', []);
      setProjectTasks(allTasks.filter(t => t.category === 'project'));
    };
    loadProjectTasks();
    window.addEventListener('storage', loadProjectTasks);
    window.addEventListener('prodify-sync', loadProjectTasks);
    return () => {
      window.removeEventListener('storage', loadProjectTasks);
      window.removeEventListener('prodify-sync', loadProjectTasks);
    };
  }, []);

  const toggleProjectTask = (id) => {
    const allTasks = getJson('matrix_tasks', []);
    const updated = allTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setJson('matrix_tasks', updated);

    setProjectTasks(updated.filter(t => t.category === 'project'));
  };

  useEffect(() => {
    if (noteMode === 'text' && editorRef.current) {
      if (activePage && editorRef.current.innerHTML !== activePage.content) {
        editorRef.current.innerHTML = activePage.content || '';
      }
    }
  }, [activePageId, activePage, noteMode]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const safeSaveToLocalStorage = (key, data) => {
    try {
      setJson(key, data);
      setSaveStatus('Tersimpan Otomatis');
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        setSaveStatus('Gagal: Memori Penuh!');
        prodifyAlert({
          title: 'Penyimpanan Lokal Penuh',
          message:
            "Penyimpanan browser Anda sudah mencapai batas.\n\nSolusi:\n1. Ekspor catatan lama ke PDF.\n2. Hapus halaman yang sudah tidak terpakai.",
        });
      } else {
        console.error("Terjadi kesalahan sistem saat menyimpan:", e);
      }
      return false;
    }
  };

  useEffect(() => {
    if (!autoSaveEnabled) return undefined;
    setSaveStatus('Menyimpan...');
    const timeout = setTimeout(() => {
      safeSaveToLocalStorage('zen_pages_multi', pages);
    }, 800);
    return () => clearTimeout(timeout);
  }, [pages, autoSaveEnabled]);

  useEffect(() => {
    const syncAutoSaveSetting = () => {
      const settings = getJson('prodify_settings', {});
      setAutoSaveEnabled(settings.autoSaveNotes !== false);
    };
    window.addEventListener('storage', syncAutoSaveSetting);
    window.addEventListener('prodify-sync', syncAutoSaveSetting);
    return () => {
      window.removeEventListener('storage', syncAutoSaveSetting);
      window.removeEventListener('prodify-sync', syncAutoSaveSetting);
    };
  }, []);

  const updateActivePage = (field, value) => {
    setPages(prevPages => prevPages.map(p => p.id === activePageId ? { ...p, [field]: value } : p));
  };

  useEffect(() => {
    if (noteMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;

      const activePage = pages.find(p => p.id === activePageId);
      if (activePage && activePage.drawingData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = activePage.drawingData;
      } else {
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [noteMode, activePageId, pages]);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = drawColor;
      ctxRef.current.lineWidth = lineWidth;
    }
  }, [drawColor, lineWidth]);

  const getCoordinatesFromClient = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const getClientPoint = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY, isTouch: true };
    }
    return { x: e.clientX, y: e.clientY, isTouch: e.pointerType === 'touch' };
  };

  const startDrawing = (e) => {
    const pt = getClientPoint(e);

    if (pt.isTouch) {
      if (pendingDrawRef.current?.timer) clearTimeout(pendingDrawRef.current.timer);
      pendingDrawRef.current = {
        startX: pt.x,
        startY: pt.y,
        ready: false,
        timer: setTimeout(() => {
          if (pendingDrawRef.current) pendingDrawRef.current.ready = true;
        }, 120),
      };
      return;
    }

    if (e.cancelable) e.preventDefault();
    setCursorPos({ x: pt.x, y: pt.y });
    setShowDrawCursor(true);
    const coords = getCoordinatesFromClient(pt.x, pt.y);
    if (!coords) return;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    const pt = getClientPoint(e);

    if (!isDrawing && pendingDrawRef.current && pt.isTouch) {
      const dx = pt.x - pendingDrawRef.current.startX;
      const dy = pt.y - pendingDrawRef.current.startY;
      const dist = Math.hypot(dx, dy);

      if (!pendingDrawRef.current.ready && dist > 10) {
        clearTimeout(pendingDrawRef.current.timer);
        pendingDrawRef.current = null;
        return;
      }

      if (pendingDrawRef.current.ready) {
        if (e.cancelable) e.preventDefault();
        setCursorPos({ x: pt.x, y: pt.y });
        setShowDrawCursor(true);
        const startCoords = getCoordinatesFromClient(pendingDrawRef.current.startX, pendingDrawRef.current.startY);
        const coords = getCoordinatesFromClient(pt.x, pt.y);
        if (!startCoords || !coords) return;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(startCoords.x, startCoords.y);
        ctxRef.current.lineTo(coords.x, coords.y);
        ctxRef.current.stroke();
        setIsDrawing(true);
        clearTimeout(pendingDrawRef.current.timer);
        pendingDrawRef.current = null;
      }
      return;
    }

    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    setCursorPos({ x: pt.x, y: pt.y });
    if (!showDrawCursor) setShowDrawCursor(true);

    const coords = getCoordinatesFromClient(pt.x, pt.y);
    if (!coords) return;
    ctxRef.current.lineTo(coords.x, coords.y);
    ctxRef.current.stroke();
  };

  const stopDrawing = (e) => {
    if (pendingDrawRef.current?.timer) {
      clearTimeout(pendingDrawRef.current.timer);
      pendingDrawRef.current = null;
    }

    if (!isDrawing) return;
    if (e?.cancelable) e.preventDefault();

    ctxRef.current.closePath();
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/webp', 0.45);
      updateActivePage('drawingData', dataUrl);
    }
    setShowDrawCursor(false);
  };

  const clearCanvas = () => {
    if (canvasRef.current && ctxRef.current) {
      const canvas = canvasRef.current;
      ctxRef.current.fillStyle = '#f9fafb';
      ctxRef.current.fillRect(0, 0, canvas.width, canvas.height);
      updateActivePage('drawingData', null);
    }
  };

  const setTool = (tool) => {
    if (tool === 'eraser') {
      setDrawColor('white');
      setLineWidth(30);
    } else {
      setDrawColor(tool);
      setLineWidth(4);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      updateActivePage('content', editorRef.current.innerHTML);
    }
  };

  const execCommand = (e, command, value = null) => {
    if (e?.preventDefault) e.preventDefault();
    if (editorRef.current) editorRef.current.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) handleEditorInput();
  };

  const handleInsertLink = async (e) => {
    e.preventDefault();
    const url = await prodifyPrompt({
      title: 'Sisipkan Tautan',
      message: 'Masukkan URL yang valid.',
      defaultValue: 'https://',
      placeholder: 'https://contoh.com',
      confirmText: 'Sisipkan',
      cancelText: 'Batal',
    });
    if (url) execCommand(e, 'createLink', String(url).trim());
  };

  const handleInsertCheckbox = (e) => {
    e.preventDefault();
    const id = Date.now();
    const checkboxHtml = `<input type="checkbox" id="cb-${id}" style="margin-right: 8px; cursor: pointer; accent-color: #4f46e5; width: 16px; height: 16px; transform: translateY(2px);"> <label for="cb-${id}">To-Do Baru</label><br>`;
    execCommand(e, 'insertHTML', checkboxHtml);
  };

  const handleExportPDF = async () => {
    if (!activePage) return;
    const sourceEl = noteMode === 'text' ? editorRef.current : canvasRef.current;
    if (!sourceEl) return;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '0';
    wrapper.style.width = pageOrientation === 'potrait' ? '816px' : '1056px';
    wrapper.style.background = '#ffffff';
    wrapper.style.color = '#0f172a';
    wrapper.style.padding = '24px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.fontFamily = "'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, sans-serif";
    wrapper.style.boxSizing = 'border-box';

    try {
      const profileInfo = getJson('prodify_profileInfo', {});
      const userSession = getJson('prodify_user', {});
      const studentName = profileInfo?.name || userSession?.name || 'Mahasiswa';
      const studentUsername = (profileInfo?.username || studentName || 'student').toString().trim().toLowerCase().replace(/\s+/g, '');
      const printedAt = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });

      const watermark = document.createElement('div');
      watermark.style.position = 'absolute';
      watermark.style.inset = '0';
      watermark.style.display = 'flex';
      watermark.style.alignItems = 'center';
      watermark.style.justifyContent = 'center';
      watermark.style.pointerEvents = 'none';
      watermark.style.opacity = '0.06';
      watermark.style.transform = 'rotate(-25deg)';
      watermark.style.fontSize = '64px';
      watermark.style.fontWeight = '900';
      watermark.style.letterSpacing = '0.12em';
      watermark.style.color = '#1e293b';
      watermark.textContent = `PRODIFY • ${studentUsername}`;
      wrapper.appendChild(watermark);

      const header = document.createElement('div');
      header.style.position = 'relative';
      header.style.zIndex = '2';
      header.style.border = '1px solid #e2e8f0';
      header.style.borderRadius = '16px';
      header.style.padding = '14px 16px';
      header.style.marginBottom = '16px';
      header.style.background = '#f8fafc';
      header.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
          <div>
            <div style="font-size:12px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#4f46e5;">Dokumen Resmi</div>
            <div style="font-size:18px;font-weight:900;margin-top:4px;color:#0f172a;">${(activePage.title || 'Catatan')}</div>
            <div style="font-size:12px;font-weight:700;margin-top:6px;color:#334155;">${studentName} • @${studentUsername}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">Dicetak</div>
            <div style="font-size:12px;font-weight:800;margin-top:6px;color:#0f172a;">${printedAt}</div>
          </div>
        </div>
      `;
      wrapper.appendChild(header);

      if (noteMode === 'text') {
        const clone = sourceEl.cloneNode(true);
        clone.contentEditable = 'false';
        clone.style.background = '#ffffff';
        clone.style.color = '#0f172a';
        clone.style.minHeight = 'auto';
        clone.style.position = 'relative';
        clone.style.zIndex = '2';
        wrapper.appendChild(clone);
      } else {
        const canvas = canvasRef.current;
        const img = new Image();
        img.alt = activePage.title || 'Whiteboard';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.src = canvas.toDataURL('image/png');
        img.style.position = 'relative';
        img.style.zIndex = '2';
        wrapper.appendChild(img);
      }

      document.body.appendChild(wrapper);

      await html2pdf().set({
        margin: 1,
        filename: `${activePage.title || 'Catatan'}_${studentUsername}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: pageOrientation === 'potrait' ? 'portrait' : 'landscape' }
      }).from(wrapper).save();
    } finally {
      wrapper.remove();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleOpenModal = () => { setNewPageTitle(''); setIsModalOpen(true); };

  const createBlankPage = (e) => {
    e.preventDefault();
    const title = newPageTitle.trim() || 'Catatan Baru';
    const newPage = { id: Date.now(), title: title, content: '', drawingData: null };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setIsModalOpen(false);
    setSearchQuery('');
  };

  // INOVASI KUNCI: AUTOMASI SKRIPSI LENGKAP & INTEGRASI MATRIX
  const createTemplateSkripsi = (e) => {
    e.preventDefault();
    const title = newPageTitle.trim() || 'Draf Skripsi & Jurnal';

    const templateContent = `
      <h1 style="text-align: center; color: #1e293b;"><strong>[JUDUL SKRIPSI / PENELITIAN]</strong></h1>
      <p style="text-align: center; color: #64748b;"><em>Gunakan template ini untuk menstrukturkan jalan pikiranmu. Sorot (blok) teks mana saja lalu klik "Jadikan Tugas" untuk melemparnya ke Target Project!</em></p>
      <hr style="margin: 20px 0;">
      
      <h2><strong>📌 PROGRESS CHECKLIST PENELITIAN</strong></h2>
      <ul style="list-style-type: none; padding-left: 0;">
        <li><input type="checkbox" style="accent-color: #10b981; transform: scale(1.2); margin-right: 8px;"> <strong>Tahap 1:</strong> Menemukan Fenomena & Gap Penelitian (Latar Belakang)</li>
        <li><input type="checkbox" style="accent-color: #10b981; transform: scale(1.2); margin-right: 8px;"> <strong>Tahap 2:</strong> Mengumpulkan minimal 10 Jurnal Pendukung (Tinjauan Pustaka)</li>
        <li><input type="checkbox" style="accent-color: #10b981; transform: scale(1.2); margin-right: 8px;"> <strong>Tahap 3:</strong> Menentukan Metode & Desain Kuesioner/Wawancara</li>
        <li><input type="checkbox" style="accent-color: #10b981; transform: scale(1.2); margin-right: 8px;"> <strong>Tahap 4:</strong> Olah Data & Bimbingan Dosen</li>
        <li><input type="checkbox" style="accent-color: #10b981; transform: scale(1.2); margin-right: 8px;"> <strong>Tahap 5:</strong> Revisi Final & Sidang</li>
      </ul>
      <br>

      <h2 style="color: #4f46e5;"><strong>BAB 1: PENDAHULUAN</strong></h2>
      <h3>1.1 Latar Belakang Masalah</h3>
      <p><em>(Tuliskan fenomena yang terjadi di lapangan. Apa kesenjangan antara teori/harapan dan realita? Kenapa masalah ini penting untuk diangkat?)</em></p>
      <br>
      <h3>1.2 Rumusan Masalah</h3>
      <ol>
        <li>Bagaimana kondisi [Variabel X] di [Lokasi/Objek Penelitian]?</li>
        <li>Sejauh mana pengaruh [Variabel X] terhadap [Variabel Y]?</li>
      </ol>
      <br>
      <h3>1.3 Tujuan Penelitian</h3>
      <p>Untuk mengidentifikasi dan menganalisis dampak dari...</p>
      <br>

      <h2 style="color: #4f46e5;"><strong>BAB 2: TINJAUAN PUSTAKA</strong></h2>
      <h3>2.1 Kajian Terdahulu (State of the Art)</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #f8fafc;">Nama Peneliti (Tahun)</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #f8fafc;">Judul Jurnal</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #f8fafc;">Hasil Temuan</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">[Peneliti 1, 2024]</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">[Pengaruh...]</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">[Menunjukkan bahwa...]</td>
          </tr>
        </tbody>
      </table>
      <br>
      <h3>2.2 Kerangka Konseptual</h3>
      <p><em>(Jelaskan hubungan antar variabel. Jika ada grand theory, tuliskan di sini.)</em></p>
      <br>

      <h2 style="color: #4f46e5;"><strong>BAB 3: METODOLOGI PENELITIAN</strong></h2>
      <h3>3.1 Jenis dan Pendekatan</h3>
      <p>Penelitian ini menggunakan pendekatan [Kuantitatif / Kualitatif] dengan metode [Eksplanatori / Deskriptif]...</p>
      <br>
      <h3>3.2 Teknik Pengumpulan Data</h3>
      <ul>
        <li>Data Primer: (Kuesioner / Wawancara mendalam dengan...)</li>
        <li>Data Sekunder: (Studi literatur, laporan BPS, dll...)</li>
      </ul>
      <br>
      
      <h2 style="color: #4f46e5;"><strong>BAB 4: HASIL & PEMBAHASAN</strong></h2>
      <p><em>(Bagian ini diisi setelah data terkumpul dan selesai diolah menggunakan SPSS / NVivo / Tools lain)</em></p>
      <br>

      <h2 style="color: #4f46e5;"><strong>BAB 5: KESIMPULAN & SARAN</strong></h2>
      <p>Berdasarkan rumusan masalah, dapat disimpulkan bahwa...</p>
      <br><br>
    `;

    const newPage = { id: Date.now(), title: title, content: templateContent, drawingData: null };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setIsModalOpen(false);
    setSearchQuery('');
    
    // AUTOMASI: Langsung tembak 3 tugas awal ke Eisenhower Matrix kategori 'Project'
    const existingTasks = getJson('matrix_tasks', []);
    const autoTasks = [
      { id: `auto1_${Date.now()}`, title: 'Drafting Bab 1: Latar Belakang & Rumusan Masalah', category: 'project', quadrant: 'urgent-important', energy: 2, completed: false, createdAt: new Date().toISOString() },
      { id: `auto2_${Date.now()}`, title: 'Kumpulkan 5 Jurnal Pendukung untuk Bab 2', category: 'project', quadrant: 'not-urgent-important', energy: 1, completed: false, createdAt: new Date().toISOString() },
      { id: `auto3_${Date.now()}`, title: 'Bimbingan Skripsi ke Dosen Pembimbing', category: 'project', quadrant: 'not-urgent-important', energy: 2, completed: false, createdAt: new Date().toISOString() },
    ];
    setJson('matrix_tasks', [...existingTasks, ...autoTasks]);
    setProjectTasks(prev => [...prev, ...autoTasks]);
    setShowProjectPanel(true);

    // Alert keberhasilan automasi
    prodifyAlert({ 
      title: "Automasi Skripsi Aktif! 🚀", 
      message: "Template komprehensif berhasil dimuat.\n\n3 Tugas Awal telah ditambahkan secara otomatis ke panel Target Project di sebelah kanan untuk mempercepat progresmu!" 
    });
  };

  const deletePage = (e, id) => {
    e.stopPropagation();
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    if (activePageId === id) setActivePageId(newPages.length > 0 ? newPages[0].id : null);
  };

  const startRename = (e, page) => { e.stopPropagation(); setEditingId(page.id); setEditTitle(page.title); };
  const confirmRename = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (editTitle.trim() === '') { setEditingId(null); return; }
    setPages(pages.map(p => p.id === id ? { ...p, title: editTitle } : p));
    setEditingId(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { prodifyAlert({ title: 'Upload Gagal', message: 'Tolong unggah file gambar yang valid.' }); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (editorRef.current) editorRef.current.focus();
        document.execCommand('insertImage', false, event.target.result);
        handleEditorInput();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const node = selection.focusNode;
        const el = node ? (node.nodeType === 3 ? node.parentElement : node) : null;
        const block = el?.closest?.('h1,h2,h3,p,div,li');

        if (block && editorRef.current && editorRef.current.contains(block)) {
          const range = selection.getRangeAt(0);
          const pre = range.cloneRange();
          pre.selectNodeContents(block);
          pre.setEnd(range.endContainer, range.endOffset);

          const preText = pre.toString().replace(/\u200B/g, '').trim();
          const applyFormat = (cmd, value = null) => {
            e.preventDefault();
            block.textContent = '';

            const caret = document.createRange();
            caret.selectNodeContents(block);
            caret.collapse(true);
            selection.removeAllRanges();
            selection.addRange(caret);

            document.execCommand(cmd, false, value);
            handleEditorInput();
          };

          if (preText === '#') return applyFormat('formatBlock', 'H1');
          if (preText === '##') return applyFormat('formatBlock', 'H2');
          if (preText === '###') return applyFormat('formatBlock', 'H3');
          if (preText === '-') return applyFormat('insertUnorderedList');
        }
      }
    }

    if (e.key === 'Enter') {
      const selection = window.getSelection();
      const node = selection.focusNode;
      if (node) {
        const element = node.nodeType === 3 ? node.parentElement : node;
        const listItem = element.closest('li');

        if (listItem && (listItem.textContent.trim() === '' || listItem.textContent === '\u200B')) {
          e.preventDefault();
          document.execCommand('outdent', false, null);
          document.execCommand('formatBlock', false, 'DIV');
        }
      }
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) { setShowTaskPopup(false); return; }
    const text = selection.toString().trim();
    if (text.length > 0 && text.length < 100) {
      const range = selection.getRangeAt(0).getBoundingClientRect();
      setSelectedText(text);
      setPopupPos({ x: range.left + (range.width / 2), y: range.top - 40 });
      setShowTaskPopup(true);
    } else {
      setSelectedText('');
      setShowTaskPopup(false);
    }
  };

  const saveToMatrix = () => {
    const cleanText = selectedText.trim();
    if (!cleanText) return;

    const existingTasks = getJson('matrix_tasks', []);
    const taskCategory = showProjectPanel ? 'project' : 'academic';
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString();
    const newTask = { id, title: cleanText, category: taskCategory, quadrant: 'unassigned', energy: 1, completed: false, createdAt: new Date().toISOString() };

    setJson('matrix_tasks', [...existingTasks, newTask]);
    
    // Sinkronisasi dengan UI panel kanan jika aktif
    if (taskCategory === 'project') {
      setProjectTasks(prev => [...prev, newTask]);
    }

    setSaveStatus('Tugas Ditambahkan!');
    setTimeout(() => setSaveStatus('Tersimpan Otomatis'), 2000);
    setShowTaskPopup(false);
    setSelectedText('');
    window.getSelection().removeAllRanges();
  };

  const saveToDeadline = () => {
    const cleanText = selectedText.trim();
    if (!cleanText) return;

    const existingDeadlines = getJson('prodify_tasks', []);
    const taskCategory = showProjectPanel ? 'project' : 'academic';
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString();
    
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
    const deadlineIso = d.toISOString();

    const newTask = {
      id,
      text: cleanText,
      deadline: deadlineIso,
      completed: false,
      completedAt: null,
      notified: false,
      category: taskCategory,
      createdAt: new Date().toISOString(),
    };

    setJson('prodify_tasks', [...existingDeadlines, newTask]);

    setSaveStatus('Deadline Ditambahkan!');
    setTimeout(() => setSaveStatus('Tersimpan Otomatis'), 2000);
    setShowTaskPopup(false);
    setSelectedText('');
    window.getSelection().removeAllRanges();
  };

  const PAGE_HEIGHT = pageOrientation === 'potrait' ? 1056 : 816;
  const PAGE_WIDTH = pageOrientation === 'potrait' ? 816 : 1056;
  const editorClasses = `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-10 md:p-16 pb-32 text-slate-800 dark:text-slate-200 text-base focus:outline-none focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-500/30 prose max-w-none prose-slate dark:prose-invert prose-img:rounded-xl prose-img:max-w-full prose-headings:font-bold break-words break-all [word-break:break-word] overflow-wrap-anywhere transition-all duration-300 ${lineSpacing} mx-auto w-full md:w-[var(--page-width)]`;
  const portalRoot = (typeof document !== 'undefined' && document.fullscreenElement) ? document.fullscreenElement : (typeof document !== 'undefined' ? document.body : null);

  return (
    <>
      <div ref={containerRef} className={`flex flex-col md:flex-row h-full liquid-glass dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden spatial-shadow transition-all ${isFullscreen ? 'fixed inset-0 z-[999] bg-slate-50 dark:bg-slate-950 w-full h-[100dvh] rounded-none' : 'rounded-3xl relative'}`}>
        <aside className="w-full md:w-64 shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col min-h-[150px] md:h-full z-10">
          <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Halaman Saya</span>
              <button onClick={handleOpenModal} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer" title="Buat Halaman">
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <div className="mb-3">
              <input type="text" placeholder="Cari catatan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-300 outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all" />
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-[30vh] md:max-h-[60vh] custom-scrollbar pr-1">
              {pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(page => (
                <div key={page.id} onClick={() => { if (editingId !== page.id) setActivePageId(page.id) }} className={`group flex items-center justify-between p-2.5 rounded-xl transition-all btn-magnetic ${activePageId === page.id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'} cursor-pointer`}>
                  <div className="flex items-center gap-2.5 overflow-hidden w-full flex-1">
                    <FileText className={`w-4 h-4 shrink-0 ${activePageId === page.id ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`} />
                    {editingId === page.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmRename(e, page.id)} autoFocus className="w-full text-xs font-semibold bg-white text-slate-800 border border-indigo-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500" />
                        <button onClick={(e) => confirmRename(e, page.id)} className="text-emerald-500 hover:text-emerald-600 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold truncate flex-1">{page.title || 'Tanpa Judul'}</span>
                    )}
                  </div>
                  {editingId !== page.id && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button onClick={(e) => startRename(e, page)} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all p-1 cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => deletePage(e, page.id)} className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 md:p-4 mt-auto border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80">
            <p className="text-[10px] text-slate-400 text-center font-bold mb-2 uppercase tracking-widest">Mode Kanvas</p>
            <div className="flex bg-slate-200/50 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setNoteMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-1.5 rounded-md transition-all ${noteMode === 'text' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                <Type className="w-3.5 h-3.5" /> Teks
              </button>
              <button
                onClick={() => setNoteMode('draw')}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-1.5 rounded-md transition-all ${noteMode === 'draw' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                <PenTool className="w-3.5 h-3.5" /> Gambar
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative min-w-0 h-[65%] md:h-full bg-white/30 dark:bg-slate-950/30 backdrop-blur-sm z-0">
          {!activePageId ? (
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
              <div className="flex flex-col items-center text-slate-400 opacity-80 text-center">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
                  <Layout className="w-12 h-12 text-indigo-200 dark:text-indigo-500/50" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold tracking-wide text-slate-600 dark:text-slate-300">Pilih halaman atau mulai nulis Skripsi.</p>
                <button onClick={handleOpenModal} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold rounded-xl text-sm transition-colors hover:bg-indigo-100 cursor-pointer">
                  Buat Dokumen Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">

              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-4 md:px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0 gap-4">
                <input type="text" placeholder="Judul Catatan..." value={activePage?.title || ''} onChange={(e) => updateActivePage('title', e.target.value)} className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white border-none outline-none bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:text-indigo-900 dark:focus:text-indigo-300 w-full transition-colors" />

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`hidden md:inline-block text-[10px] whitespace-nowrap font-bold px-3 py-1.5 rounded-full border transition-colors ${saveStatus === 'Menyimpan...' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' : saveStatus.includes('Gagal') ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'}`}>
                    {saveStatus}
                  </span>

                  <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setShowProjectPanel(!showProjectPanel)}
                    className={`flex items-center gap-1.5 p-2 md:px-3 text-xs font-bold rounded-xl border shadow-sm cursor-pointer transition-colors ${showProjectPanel ? 'bg-rose-600 text-white border-rose-500' : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`}
                  >
                    <Target className="w-4 h-4" /> <span className="hidden md:inline">Target Project</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col border-b border-slate-200/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-20 shrink-0 shadow-sm">

                {noteMode === 'text' ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 px-4 justify-start overflow-x-auto custom-scrollbar">
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <select value={currentFont} onChange={(e) => { setCurrentFont(e.target.value); execCommand(e, 'fontName', e.target.value); }} className="bg-transparent text-slate-700 dark:text-slate-300 text-xs font-semibold focus:ring-0 outline-none cursor-pointer p-1.5 min-w-[120px]">
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Calibri">Calibri</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Tahoma">Tahoma</option>
                          <option value="Georgia">Georgia</option>
                        </select>
                        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center"></div>
                        <select value={currentFontSize} onChange={(e) => { setCurrentFontSize(e.target.value); execCommand(e, 'fontSize', e.target.value); }} className="bg-transparent text-slate-700 dark:text-slate-300 text-xs font-semibold focus:ring-0 outline-none cursor-pointer p-1.5">
                          <option value="1">Sangat Kecil</option>
                          <option value="2">Kecil</option>
                          <option value="3">Normal</option>
                          <option value="4">Sedang</option>
                          <option value="5">Besar</option>
                          <option value="6">Sangat Besar</option>
                          <option value="7">Raksasa</option>
                        </select>
                      </div>

                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'undo')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Undo className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'redo')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Redo className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                        <button onMouseDown={(e) => { e.preventDefault(); if (editorRef.current) { editorRef.current.focus(); document.execCommand('removeFormat', false, null); document.execCommand('formatBlock', false, 'DIV'); handleEditorInput(); } }} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><RemoveFormatting className="w-4 h-4" /></button>
                      </div>

                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'H1')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Heading1 className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'H2')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Heading2 className="w-4 h-4" /></button>
                      </div>

                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'bold')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Bold className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'italic')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Italic className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'underline')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Underline className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'strikeThrough')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Strikethrough className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-1 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'justifyLeft')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><AlignLeft className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'justifyCenter')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><AlignCenter className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'justifyRight')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><AlignRight className="w-4 h-4" /></button>
                      </div>

                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'insertUnorderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><List className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'insertOrderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><ListOrdered className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'BLOCKQUOTE')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Quote className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1 self-center"></div>
                        <button onMouseDown={handleInsertLink} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-indigo-600 dark:text-indigo-400 tooltip"><Link className="w-4 h-4" /></button>
                        <button onMouseDown={handleInsertCheckbox} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-emerald-600 dark:text-emerald-400 tooltip"><CheckSquare className="w-4 h-4" /></button>

                      </div>

                    </div>
                    <div className="flex flex-wrap items-center gap-3 p-2 px-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto custom-scrollbar">
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30">
                        <ImageIcon className="w-3.5 h-3.5" /> Gambar
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                      </button>
                      <button onClick={() => setPageOrientation(prev => prev === 'potrait' ? 'landscape' : 'potrait')} className={`flex items-center gap-1.5 transition-colors p-1 px-2 rounded-lg cursor-pointer border ${pageOrientation === 'landscape' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/50' : 'hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border-transparent'}`}>
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Orientasi ({pageOrientation === 'potrait' ? 'Potrait' : 'Landscape'})
                      </button>
                      <button onClick={handleExportPDF} className="flex items-center gap-1.5 hover:text-white transition-colors p-1.5 px-3 rounded-lg bg-indigo-600 text-white shadow-sm cursor-pointer ml-auto hover:bg-indigo-700"><Printer className="w-3.5 h-3.5" /> Export PDF</button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 p-2 px-4 overflow-x-auto custom-scrollbar bg-slate-50/80 dark:bg-slate-900/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">Peralatan</span>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[
                        { color: 'black', label: 'Hitam' },
                        { color: '#ef4444', label: 'Merah' },
                        { color: '#22c55e', label: 'Hijau' },
                        { color: '#3b82f6', label: 'Biru' },
                      ].map((marker) => (
                        <button
                          key={marker.color}
                          onClick={() => setTool(marker.color)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${drawColor === marker.color ? 'scale-125 border-slate-400 dark:border-white' : 'border-transparent hover:scale-110'}`}
                          style={{ backgroundColor: marker.color }}
                          title={`Spidol ${marker.label}`}
                        />
                      ))}
                    </div>

                    <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPageOrientation(prev => prev === 'potrait' ? 'landscape' : 'potrait')}
                        className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors ${
                          pageOrientation === 'landscape'
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Ubah Orientasi Kanvas"
                      >
                        <ArrowLeftRight className="w-4 h-4" /> {pageOrientation === 'potrait' ? 'Potrait' : 'Landscape'}
                      </button>
                      <button
                        onClick={() => setTool('eraser')}
                        className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors ${drawColor === 'white' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        <Eraser className="w-4 h-4" /> Penghapus
                      </button>
                      <button
                        onClick={clearCanvas}
                        className="p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" /> Bersihkan Papan
                      </button>
                    </div>

                    <button onClick={handleExportPDF} className="flex items-center gap-1.5 hover:text-white transition-colors p-1.5 px-3 rounded-lg bg-indigo-600 text-white shadow-sm cursor-pointer ml-auto text-xs font-bold">
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 flex overflow-hidden w-full relative">
                <div className={`flex-1 overflow-auto w-full custom-scrollbar bg-slate-200/50 dark:bg-slate-950 p-4 md:p-8 transition-all duration-300 ${showProjectPanel ? 'md:mr-72' : ''}`}>
                  {noteMode === 'text' ? (
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={handleEditorInput}
                      onKeyDown={handleKeyDown}
                      onMouseUp={handleTextSelection}
                      onKeyUp={handleTextSelection}
                      onBlur={() => setTimeout(() => setShowTaskPopup(false), 120)}
                      className={editorClasses}
                      style={{ minHeight: `${PAGE_HEIGHT}px`, height: 'max-content', marginBottom: '40px', '--page-width': `${PAGE_WIDTH}px`, width: `${PAGE_WIDTH}px` }}
                      data-placeholder="Mulai menulis jurnal, gagasan, atau draf project di sini..."
                    />
                  ) : (
                    <div className="w-full md:w-[var(--page-width)] bg-[#f9fafb] border border-slate-200 shadow-md relative min-h-[420px] md:min-h-[700px] cursor-crosshair touch-auto mx-auto" style={{ '--page-width': `${PAGE_WIDTH}px`, width: `${PAGE_WIDTH}px` }}>
                      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                      <canvas
                        ref={canvasRef}
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerCancel={stopDrawing}
                        onPointerOut={stopDrawing}
                        className={`absolute inset-0 w-full h-full ${isDrawing ? 'touch-none' : 'touch-pan-y'}`}
                      />
                    </div>
                  )}
                  {showTaskPopup && noteMode === 'text' && (
                    <div
                      className="absolute z-50 animate-fade-in-up bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2"
                      style={{ left: `${popupPos.x}px`, top: `${popupPos.y}px`, transform: 'translateX(-50%)' }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black whitespace-nowrap">{showProjectPanel ? 'Text → Project Task' : 'Text → Task'}</span>
                      <div className="w-px h-5 bg-white/15 mx-1" />
                      <button
                        className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white/10 hover:bg-indigo-600 transition-colors cursor-pointer"
                        onClick={saveToMatrix}
                        title="Masukkan ke Eisenhower Matrix"
                      >
                        Matrix
                      </button>
                      <button
                        className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white/10 hover:bg-rose-600 transition-colors cursor-pointer"
                        onClick={saveToDeadline}
                        title="Masukkan ke Deadline Tracker (default: besok 23:59)"
                      >
                        Deadline
                      </button>
                    </div>
                  )}
                </div>
                <div className={`absolute right-0 top-0 bottom-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/60 dark:border-slate-700/60 shadow-2xl transition-transform duration-300 z-40 flex flex-col ${showProjectPanel ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center bg-rose-50/50 dark:bg-rose-900/10">
                    <h4 className="font-black text-rose-600 dark:text-rose-400 flex items-center gap-2 text-sm">
                      <Target className="w-5 h-5" /> Target Project
                    </h4>
                    <button onClick={() => setShowProjectPanel(false)} className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-500 cursor-pointer">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    {projectTasks.length === 0 ? (
                      <div className="flex flex-col items-center text-center mt-10 text-slate-500 dark:text-slate-400">
                        <CheckSquare className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-xs font-medium">Belum ada tugas project.<br /><br />Blok teks di editor samping, lalu pilih "Jadikan Target Project" untuk mulai memecah tugas skripsimu!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projectTasks.map(task => (
                          <div key={task.id} className={`p-3 rounded-xl border transition-all ${task.completed ? 'bg-slate-50 border-slate-200 opacity-60 dark:bg-slate-800 dark:border-slate-700' : 'bg-white border-rose-200 dark:bg-slate-800 dark:border-rose-500/30 shadow-sm hover:border-rose-300'}`}>
                            <div className="flex items-start gap-3">
                              <button onClick={() => toggleProjectTask(task.id)} className={`mt-0.5 shrink-0 rounded-full w-5 h-5 flex items-center justify-center border transition-colors cursor-pointer ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'}`}>
                                {task.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                              </button>
                              <p className={`text-sm font-semibold leading-snug ${task.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {noteMode === 'draw' && showDrawCursor && (
                <div
                  className="pointer-events-none fixed z-[9999]"
                  style={{
                    left: cursorPos.x,
                    top: cursorPos.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="w-4 h-4 rounded-full border-2 border-black/80 bg-transparent shadow-sm" />
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 flex gap-2">
            <button onClick={handleOpenModal} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all flex items-center justify-center cursor-pointer group z-50">
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>
        </main>
        {isModalOpen && portalRoot && createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white dark:border-slate-700 overflow-hidden animate-fade-in-up">
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-b border-indigo-100 dark:border-indigo-500/20 px-6 py-5 flex items-center gap-3">
                <NekoMascotMini className="w-12 h-12 shrink-0" />
                <div className="relative bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
                  <div className="absolute -left-2 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white dark:border-r-slate-800 border-b-[6px] border-b-transparent"></div>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 italic">"Mau nulis catatan biasa, atau nyicil skripsi nih? Nyaa~ 🎓"</p>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                  <FilePlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Dokumen Baru
                </h3>
                <div className="mb-6">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Nama Dokumen</label>
                  <input type="text" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} placeholder="Misal: Draf Bab 1" autoFocus className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white font-bold transition-all text-sm" />
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={createTemplateSkripsi} className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Zap className="w-5 h-5 relative z-10" /> 
                    <span className="relative z-10">Automasi Template Skripsi</span>
                  </button>
                  <button onClick={createBlankPage} className="w-full px-6 py-4 rounded-xl font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30">
                    <FileText className="w-5 h-5" /> Catatan Kosong Biasa
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="mt-2 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">Batal</button>
                </div>
              </div>
            </div>
          </div>
          , portalRoot)}
      </div>
    </>
  );
};

export default ZenNotes;