import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Layout, FilePlus, FileText, Trash2, Bold, Italic, List, ListOrdered, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Quote, Edit2, X, Check, Maximize2, Minimize2, Image as ImageIcon, Type, RemoveFormatting, CheckSquare, Printer, PenTool, Eraser, Palette, ArrowLeftRight, PaintBucket, Link, Undo, Redo } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { NekoMascotMini } from './NekoMascot';

const ZenNotes = () => {
  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem('zen_pages_multi');
    return saved ? JSON.parse(saved) : [{ id: 1, title: 'Ide Proyek Akhir', content: '', drawingData: null }];
  });

  const [activePageId, setActivePageId] = useState(() => {
    const saved = localStorage.getItem('zen_pages_multi');
    const parsed = saved ? JSON.parse(saved) : null;
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

  // Mode Notes: 'text' or 'draw' (Whiteboard)
  const [noteMode, setNoteMode] = useState('text');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageOrientation, setPageOrientation] = useState('potrait');
  const [lineSpacing, setLineSpacing] = useState('leading-relaxed');
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentFontSize, setCurrentFontSize] = useState('3');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    const settings = JSON.parse(localStorage.getItem('stuprod_settings') || '{}');
    return settings.autoSaveNotes !== false;
  });

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // --- WHITEBOARD REFERENCES & STATES ---
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('black');
  const [lineWidth, setLineWidth] = useState(4);

  const activePage = pages.find(p => p.id === activePageId);
  const wordCount = useMemo(() => {
    const html = activePage?.content || '';
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }, [activePage?.content]);

  // Focus and populate text editor
  useEffect(() => {
    if (noteMode === 'text' && editorRef.current) {
      if (activePage && editorRef.current.innerHTML !== activePage.content) {
        editorRef.current.innerHTML = activePage.content || '';
      }
    }
  }, [activePageId, activePage, noteMode]);

  // Handle Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ==========================================
  // SAFE STORAGE ENGINE (PENANGANAN ERROR MEMORI)
  // ==========================================
  const safeSaveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setSaveStatus('Tersimpan Otomatis');
      return true;
    } catch (e) {
      // Deteksi error jika memori LocalStorage penuh
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        setSaveStatus('Gagal: Memori Penuh!');
        alert("🚨 MEMORI LOKAL BROWSER PENUH! 🚨\n\nKarena StuProd mengutamakan privasi (Local-First), penyimpanan browser Anda telah mencapai batas.\n\nSolusi:\n1. Ekspor catatan lama Anda ke PDF.\n2. Hapus halaman catatan lama untuk mengosongkan memori.");
      } else {
        console.error("Terjadi kesalahan sistem saat menyimpan:", e);
      }
      return false;
    }
  };

  // Autosave
  useEffect(() => {
    if (!autoSaveEnabled) return undefined;
    
    // Ubah status saat mulai menyimpan
    setSaveStatus('Menyimpan...');
    
    const timeout = setTimeout(() => {
      safeSaveToLocalStorage('zen_pages_multi', pages);
    }, 800);
    return () => clearTimeout(timeout);
  }, [pages, autoSaveEnabled]);

  useEffect(() => {
    const syncAutoSaveSetting = () => {
      const settings = JSON.parse(localStorage.getItem('stuprod_settings') || '{}');
      setAutoSaveEnabled(settings.autoSaveNotes !== false);
    };
    window.addEventListener('storage', syncAutoSaveSetting);
    return () => window.removeEventListener('storage', syncAutoSaveSetting);
  }, []);

  const updateActivePage = (field, value) => {
    setPages(prevPages => prevPages.map(p => p.id === activePageId ? { ...p, [field]: value } : p));
  };

  // ==========================================
  // LOGIKA WHITEBOARD (CANVAS 2D)
  // ==========================================

  // Setup Canvas
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
        ctx.fillStyle = 'white';
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

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    ctxRef.current.lineTo(coords.x, coords.y);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    ctxRef.current.closePath();
    setIsDrawing(false);

    if (canvasRef.current) {
      // KOMPRESI GAMBAR: Gunakan format WebP dengan kualitas 50% untuk menghemat memori
      const dataUrl = canvasRef.current.toDataURL('image/webp', 0.5);
      updateActivePage('drawingData', dataUrl);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current && ctxRef.current) {
      const canvas = canvasRef.current;
      ctxRef.current.fillStyle = 'white';
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

  // ==========================================
  // LOGIKA TEKS EDITOR STANDARD
  // ==========================================
  const handleEditorInput = () => {
    if (editorRef.current) {
      updateActivePage('content', editorRef.current.innerHTML);
    }
  };

  const execCommand = (e, command, value = null) => {
    e.preventDefault();
    if (editorRef.current) editorRef.current.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) handleEditorInput();
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    const url = prompt('Masukkan tautan (URL):', 'https://');
    if (url) execCommand(e, 'createLink', url);
  };

  const handleInsertCheckbox = (e) => {
    e.preventDefault();
    const id = Date.now();
    const checkboxHtml = `<input type="checkbox" id="cb-${id}" style="margin-right: 8px; cursor: pointer;"> <label for="cb-${id}">To-Do Baru</label><br>`;
    execCommand(e, 'insertHTML', checkboxHtml);
  };

  const handleExportPDF = () => {
    if (!activePage) return;

    let element;
    if (noteMode === 'text') {
      element = editorRef.current;
    } else {
      element = canvasRef.current;
    }

    if (!element) return;

    const isDark = document.documentElement.classList.contains('dark');
    if (isDark && noteMode === 'text') {
      element.style.color = '#1e293b';
      element.style.backgroundColor = '#ffffff';
    }

    html2pdf().set({
      margin: 1, filename: `${activePage.title || 'Catatan'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: pageOrientation === 'potrait' ? 'portrait' : 'landscape' }
    }).from(element).save().then(() => {
      if (isDark && noteMode === 'text') {
        element.style.color = '';
        element.style.backgroundColor = '';
      }
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleOpenModal = () => { setNewPageTitle(''); setIsModalOpen(true); };
  const confirmCreateNewPage = (e) => {
    e.preventDefault();
    const title = newPageTitle.trim() || 'Catatan Baru';
    const newPage = { id: Date.now(), title: title, content: '', drawingData: null };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setIsModalOpen(false);
    setSearchQuery('');
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
      if (!file.type.startsWith('image/')) { alert('Tolong unggah file gambar yang valid.'); return; }
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
    const existingTasks = JSON.parse(localStorage.getItem('matrix_tasks') || '[]');
    const newTask = { id: Date.now().toString(), title: cleanText, tag: 'Dari Catatan', quadrant: 'unassigned', energy: 1, completed: false };
    localStorage.setItem('matrix_tasks', JSON.stringify([...existingTasks, newTask]));
    window.dispatchEvent(new Event('storage'));
    setSaveStatus('Tugas Ditambahkan!');
    setTimeout(() => setSaveStatus('Tersimpan Otomatis'), 2000);
    setShowTaskPopup(false);
    setSelectedText('');
    window.getSelection().removeAllRanges();
  };
  const PAGE_HEIGHT = pageOrientation === 'potrait' ? 1056 : 816;

  const editorClasses = `w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-10 md:p-16 pb-32 text-slate-800 dark:text-slate-200 text-base focus:outline-none focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-500/30 prose prose-slate dark:prose-invert prose-img:rounded-xl prose-img:max-w-full prose-headings:font-bold break-words break-all [word-break:break-word] overflow-wrap-anywhere transition-all duration-300 ${lineSpacing} ${pageOrientation === 'potrait' ? 'max-w-[816px]' : 'max-w-[1056px]'}`;

  return (
    <>
      <div ref={containerRef} className={`flex flex-col md:flex-row h-full liquid-glass dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden spatial-shadow transition-all ${isFullscreen ? 'fixed inset-0 z-[999] bg-slate-50 dark:bg-slate-950 w-full h-[100dvh] rounded-none' : 'rounded-3xl relative'}`}>

        {/* SIDEBAR */}
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

          {/* Mode Switcher */}
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

        {/* WORKSPACE */}
        <main className="flex-1 flex flex-col relative min-w-0 h-[65%] md:h-full bg-white/30 dark:bg-slate-950/30 backdrop-blur-sm z-0">
          {!activePageId ? (
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
              <div className="flex flex-col items-center text-slate-400 opacity-80">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
                  <Layout className="w-12 h-12 text-indigo-200 dark:text-indigo-500/50" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold tracking-wide">Pilih atau buat halaman.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0 h-full">

              {/* HEADER */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0 gap-4">
                <input type="text" placeholder="Judul Catatan..." value={activePage?.title || ''} onChange={(e) => updateActivePage('title', e.target.value)} className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white border-none outline-none bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:text-indigo-900 dark:focus:text-indigo-300 w-full transition-colors" />
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] whitespace-nowrap font-bold px-3 py-1.5 rounded-full border transition-colors ${saveStatus === 'Menyimpan...' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' : saveStatus.includes('Gagal') ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'}`}>
                    {saveStatus}
                  </span>

                  {noteMode === 'text' && (
                    <span className="hidden md:flex text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 items-center gap-1">
                      <Type className="w-3 h-3" /> {wordCount} Kata
                    </span>
                  )}

                  <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* TOOLBARS */}
              <div className="flex flex-col border-b border-slate-200/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-20 shrink-0 shadow-sm">

                {noteMode === 'text' ? (
                  <>
                    {/* TEXT TOOLBAR ROW 1 */}
                    <div className="flex flex-wrap items-center gap-1.5 p-2 px-4 justify-start overflow-x-auto custom-scrollbar">

                      {/* Font Options */}
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

                      {/* Undo/Redo */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'undo')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Undo className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'redo')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Redo className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                        <button onMouseDown={(e) => { e.preventDefault(); if (editorRef.current) { editorRef.current.focus(); document.execCommand('removeFormat', false, null); document.execCommand('formatBlock', false, 'DIV'); handleEditorInput(); } }} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><RemoveFormatting className="w-4 h-4" /></button>
                      </div>

                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                      {/* Headings */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'H1')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Heading1 className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'H2')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Heading2 className="w-4 h-4" /></button>
                      </div>

                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                      {/* Formatting B/I/U/S */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'bold')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Bold className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'italic')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Italic className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'underline')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Underline className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'strikeThrough')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Strikethrough className="w-4 h-4" /></button>
                      </div>

                      {/* Colors */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-1 border border-slate-200/60 dark:border-slate-700/60">
                        <label className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-indigo-600 dark:text-indigo-400 relative cursor-pointer tooltip" title="Warna Teks">
                          <Type className="w-4 h-4 pointer-events-none" />
                          <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => { if (editorRef.current) editorRef.current.focus(); execCommand(e, 'foreColor', e.target.value); }} />
                        </label>
                        <label className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-amber-500 relative cursor-pointer tooltip" title="Warna Highlight">
                          <PaintBucket className="w-4 h-4 pointer-events-none" />
                          <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => { if (editorRef.current) editorRef.current.focus(); execCommand(e, 'hiliteColor', e.target.value); }} />
                        </label>
                      </div>

                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                      {/* Alignment */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'justifyLeft')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><AlignLeft className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'justifyCenter')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><AlignCenter className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'justifyRight')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><AlignRight className="w-4 h-4" /></button>
                      </div>

                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                      {/* Lists & Links */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                        <button onMouseDown={(e) => execCommand(e, 'insertUnorderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><List className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'insertOrderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><ListOrdered className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'BLOCKQUOTE')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 tooltip"><Quote className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1 self-center"></div>
                        <button onMouseDown={handleInsertLink} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-indigo-600 dark:text-indigo-400 tooltip"><Link className="w-4 h-4" /></button>
                        <button onMouseDown={handleInsertCheckbox} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-emerald-600 dark:text-emerald-400 tooltip"><CheckSquare className="w-4 h-4" /></button>

                        {/* Spasi Baris */}
                        <select value={lineSpacing} onChange={(e) => setLineSpacing(e.target.value)} className="bg-transparent text-slate-600 dark:text-slate-300 text-xs font-semibold focus:ring-0 outline-none cursor-pointer p-1 ml-1">
                          <option value="leading-none">Spasi 1.0</option>
                          <option value="leading-snug">Spasi 1.15</option>
                          <option value="leading-relaxed">Spasi 1.5</option>
                          <option value="leading-loose">Spasi 2.0</option>
                        </select>
                      </div>

                    </div>

                    {/* TEXT TOOLBAR ROW 2 */}
                    <div className="flex flex-wrap items-center gap-3 p-2 px-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto custom-scrollbar">
                      <div className="flex items-center gap-1.5 mr-2 text-indigo-700 dark:text-indigo-400"><Palette className="w-4 h-4" /> <span className="hidden md:inline">Sisipkan:</span></div>
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
                  // DRAWING TOOLBAR (WHITEBOARD)
                  <div className="flex flex-wrap items-center gap-3 p-2 px-4 overflow-x-auto custom-scrollbar bg-slate-50/80 dark:bg-slate-900/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">Peralatan</span>

                    {/* Markers */}
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

                    {/* Tools */}
                    <div className="flex items-center gap-1">
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

              {/* EDITOR AREA */}
              <div className="flex-1 overflow-auto w-full custom-scrollbar bg-slate-200/50 dark:bg-slate-950 flex justify-center items-start p-4 md:p-8 relative">

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
                    style={{ minHeight: `${PAGE_HEIGHT}px`, height: 'max-content', marginBottom: '40px' }}
                    data-placeholder="Mulai menulis jurnal, gagasan, atau tugasmu di sini..."
                  />
                ) : (
                  <div className="w-full max-w-[1056px] bg-white border border-slate-200 shadow-md relative" style={{ minHeight: '700px', cursor: 'crosshair', touchAction: 'none' }}>
                    <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    <canvas
                      ref={canvasRef}
                      onPointerDown={startDrawing}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      onPointerOut={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 w-full h-full touch-none"
                    />
                  </div>
                )}

                {/* Floating Popup "Jadikan Tugas" */}
                {showTaskPopup && noteMode === 'text' && (
                  <div className="absolute z-50 animate-fade-in-up bg-slate-900 dark:bg-slate-800 border dark:border-slate-700 text-white px-3 py-2 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-indigo-600 transition-colors" style={{ left: `${popupPos.x}px`, top: `${popupPos.y}px`, transform: 'translateX(-50%)' }} onClick={saveToMatrix} onMouseDown={(e) => e.preventDefault()}>
                    <CheckSquare className="w-4 h-4 text-emerald-400" /><span className="text-xs font-bold">Kirim ke Balance Matrix</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 flex gap-2">
            <button onClick={handleOpenModal} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all flex items-center justify-center cursor-pointer group"><Plus className="w-6 h-6" strokeWidth={2.5} /></button>
          </div>
        </main>

        {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white dark:border-slate-700 overflow-hidden animate-fade-in-up">
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-b border-indigo-100 dark:border-indigo-500/20 px-6 py-5 flex items-center gap-3">
                <NekoMascotMini className="w-12 h-12 shrink-0" />
                <div className="relative bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-2">
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 italic">"Mau nulis apa hari ini? Nyaa~ 📚"</p>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6"><FilePlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Buat Catatan Baru</h3>
                <form onSubmit={confirmCreateNewPage}>
                  <div className="mb-8">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Nama Catatan / File</label>
                    <input type="text" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} placeholder="Misal: Catatan Rapat BEM" autoFocus className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white font-bold transition-all text-sm" />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Batal</button>
                    <button type="submit" className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer">Buat Dokumen</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          , document.body)}
      </div>
    </>
  );
};

export default ZenNotes;