import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Layout, FilePlus, FileText, Trash2, Bold, Italic, List, ListOrdered, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Quote, Edit2, X, Check, Maximize2, Minimize2, Image as ImageIcon, Table, BarChart2, Languages, Type, SpellCheck, Mail, ArrowLeftRight, PaintBucket, Palette, Link, Undo, Redo, RemoveFormatting, CheckSquare, Printer } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { NekoMascotMini } from './NekoMascot';

const ZenNotes = () => {
  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem('zen_pages_multi');
    return saved ? JSON.parse(saved) : [{ id: 1, title: 'Ide Proyek Akhir', content: '' }];
  });

  const [activePageId, setActivePageId] = useState(() => {
    const saved = localStorage.getItem('zen_pages_multi');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed[0].id : 1;
  });

  const [saveStatus, setSaveStatus] = useState('Tersimpan Otomatis');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  // States for renaming in sidebar
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // States for Smart Reminder (Text -> Matrix)
  const [selectedText, setSelectedText] = useState('');
  const [showTaskPopup, setShowTaskPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  // Fullscreen & Formatting states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageOrientation, setPageOrientation] = useState('potrait');
  const [lineSpacing, setLineSpacing] = useState('leading-relaxed');
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentFontSize, setCurrentFontSize] = useState('3');

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Focus and populate editor when active page changes
  useEffect(() => {
    if (editorRef.current) {
      const activePage = pages.find(p => p.id === activePageId);
      if (activePage && editorRef.current.innerHTML !== activePage.content) {
        editorRef.current.innerHTML = activePage.content;
      }
    }
  }, [activePageId]);

  // Autosave
  useEffect(() => {
    setSaveStatus('Menyimpan...');
    const timeout = setTimeout(() => {
      localStorage.setItem('zen_pages_multi', JSON.stringify(pages));
      setSaveStatus('Tersimpan Otomatis');
    }, 800);

    return () => clearTimeout(timeout);
  }, [pages]);

  const handleOpenModal = () => {
    setNewPageTitle('');
    setIsModalOpen(true);
  };

  const confirmCreateNewPage = (e) => {
    e.preventDefault();
    const title = newPageTitle.trim() || 'Catatan Baru';
    const newPage = {
      id: Date.now(),
      title: title,
      content: ''
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setIsModalOpen(false);
  };

  const deletePage = (e, id) => {
    e.stopPropagation();
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    if (activePageId === id) {
      setActivePageId(newPages.length > 0 ? newPages[0].id : null);
    }
  };

  const updateActivePage = (field, value) => {
    setPages(pages.map(p =>
      p.id === activePageId ? { ...p, [field]: value } : p
    ));
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      updateActivePage('content', editorRef.current.innerHTML);
    }
  };

  const execCommand = (e, command, value = null) => {
    e.preventDefault(); // Prevent button click from stealing focus
    if (editorRef.current) {
      editorRef.current.focus(); // Ensure editor has focus BEFORE command
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleEditorInput();
    }
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    const url = prompt('Masukkan tautan (URL):', 'https://');
    if (url) {
      execCommand(e, 'createLink', url);
    }
  };

  const handleInsertCheckbox = (e) => {
    e.preventDefault();
    const id = Date.now();
    const checkboxHtml = `<input type="checkbox" id="cb-${id}" style="margin-right: 8px; cursor: pointer;"> <label for="cb-${id}">To-Do Baru</label><br>`;
    execCommand(e, 'insertHTML', checkboxHtml);
  };

  const handleExportPDF = () => {
    if (!activePage || !editorRef.current) return;
    const element = editorRef.current;
    const opt = {
      margin: 1,
      filename: `${activePage.title || 'Catatan'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Renaming logic
  const startRename = (e, page) => {
    e.stopPropagation();
    setEditingId(page.id);
    setEditTitle(page.title);
  };

  const confirmRename = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitle.trim() === '') {
      setEditingId(null);
      return;
    }
    setPages(pages.map(p =>
      p.id === id ? { ...p, title: editTitle } : p
    ));
    setEditingId(null);
  };

  const handleMockFeature = (featureName) => {
    alert(`Fitur [${featureName}] merupakan fitur tingkat lanjut. Di versi ekosistem frontend-only ini, fungsionalitas visual telah disediakan namun untuk memproses asli membutuhkan integrasi lebih lanjut.`);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Tolong unggah file gambar yang valid.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (editorRef.current) editorRef.current.focus();
        document.execCommand('insertImage', false, event.target.result);
        handleEditorInput();
      };
      reader.readAsDataURL(file);
    }
  };

  const activePage = pages.find(p => p.id === activePageId);

  const PAGE_HEIGHT = pageOrientation === 'potrait' ? 1056 : 816;

  // Dynamic CSS classes for out-of-bounds fixing and page growth
  const editorClasses = `w-full border border-slate-200 shadow-sm p-10 md:p-16 pb-32 text-slate-800 text-base focus:outline-none focus:ring-1 focus:ring-indigo-100 prose prose-slate prose-img:rounded-xl prose-img:max-w-full prose-headings:font-bold break-words break-all [word-break:break-word] overflow-wrap-anywhere transition-all duration-300 ${lineSpacing} ${pageOrientation === 'potrait' ? 'max-w-[816px]' : 'max-w-[1056px]'}`;

  // Handle keydown for smart list escaping
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      const node = selection.focusNode;
      if (node) {
        // Cari parent element yang membungkus kursor saat ini
        const element = node.nodeType === 3 ? node.parentElement : node;
        const listItem = element.closest('li');

        // Jika kita berada di dalam tag <li> dan <li> tersebut kosong atau nyaris kosong
        if (listItem && (listItem.textContent.trim() === '' || listItem.textContent === '\u200B')) {
          e.preventDefault(); // Cegah pembuatan <br> atau <li> baru
          // Paksa keluar dari list dengan command "outdent" dua kali lipat seringkali berhasil memecahnya
          document.execCommand('outdent', false, null);
          document.execCommand('formatBlock', false, 'DIV'); // Kembalikan ke format div standar / paragraf
        }
      }
    }
  };

  // Smart Reminder: handle text selection inside the editor
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowTaskPopup(false);
      return;
    }
    const text = selection.toString().trim();

    if (text.length > 0 && text.length < 100) { // Limit length for tasks
      const range = selection.getRangeAt(0).getBoundingClientRect();
      const editorBounds = editorRef.current.getBoundingClientRect();

      // Calculate position relative to viewport
      setSelectedText(text);
      setPopupPos({
        x: range.left + (range.width / 2),
        y: range.top - 40 // Hover above the text
      });
      setShowTaskPopup(true);
    } else {
      setShowTaskPopup(false);
    }
  };

  // Save selected text as a task in the Balance Matrix
  const saveToMatrix = () => {
    const existingTasks = JSON.parse(localStorage.getItem('matrix_tasks') || '[]');
    const newTask = {
      id: Date.now().toString(),
      title: selectedText,
      tag: 'Dari Catatan',
      quadrant: 'urgent-academic' // Default to urgent-important quadrant
    };
    localStorage.setItem('matrix_tasks', JSON.stringify([...existingTasks, newTask]));

    // Status visual feedback
    setSaveStatus('Tugas Ditambahkan ke Matrix!');
    setTimeout(() => setSaveStatus('Tersimpan Otomatis'), 2000);
    setShowTaskPopup(false);

    // Clear selection
    window.getSelection().removeAllRanges();
  };

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-[60] bg-white animate-fade-in p-0 md:p-4"
    : "h-full w-full max-h-[calc(100vh-140px)] animate-fade-in-up relative";

  return (
    <>
      <div className={`flex flex-col md:flex-row h-full liquid-glass border border-slate-200/50 overflow-hidden spatial-shadow ${isFullscreen ? 'rounded-none md:rounded-3xl' : 'rounded-3xl'}`}>

        {/* Sidebar Halaman Saya */}
        <aside className="w-full md:w-64 shrink-0 bg-white/40 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-200/50 flex flex-col min-h-[150px] md:h-full">
          <div className="p-3 md:p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Halaman Saya</span>
              <button onClick={handleOpenModal} className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" title="Buat Halaman">
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-[30vh] md:max-h-[60vh] custom-scrollbar pr-1">
              {pages.map(page => (
                <div
                  key={page.id}
                  onClick={() => { if (editingId !== page.id) setActivePageId(page.id) }}
                  className={`group flex items-center justify-between p-2.5 rounded-xl transition-all btn-magnetic ${activePageId === page.id ? 'bg-indigo-600 text-white shadow-[0_4px_10px_-2px_rgba(79,70,229,0.4)]' : 'hover:bg-white/60 text-slate-600'} cursor-pointer`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden w-full flex-1">
                    <FileText className={`w-4 h-4 shrink-0 ${activePageId === page.id ? 'text-indigo-200' : 'text-slate-400'}`} />

                    {editingId === page.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && confirmRename(e, page.id)}
                          autoFocus
                          className="w-full text-xs font-semibold bg-white border border-indigo-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                        <button onClick={(e) => confirmRename(e, page.id)} className="text-emerald-500 hover:text-emerald-600 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold truncate flex-1">{page.title || 'Tanpa Judul'}</span>
                    )}
                  </div>

                  {editingId !== page.id && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={(e) => startRename(e, page)}
                        className="text-slate-400 hover:text-indigo-500 transition-all p-1 cursor-pointer"
                        title="Ganti Nama"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => deletePage(e, page.id)}
                        className="text-slate-400 hover:text-rose-500 transition-all p-1 cursor-pointer"
                        title="Hapus Halaman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {pages.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 font-medium">Kosong.</p>
              )}
            </div>
          </div>
          <div className="p-3 md:p-4 mt-auto border-t border-slate-200 bg-slate-50/80">
            <p className="text-[10px] text-slate-400 text-center font-bold">Tip: Klik + untuk buat halaman baru.</p>
          </div>
        </aside>

        {/* Main Workspace Area (Docs-like Editor) */}
        <main className="flex-1 flex flex-col relative min-w-0 h-[65%] md:h-full bg-white/30 backdrop-blur-sm">
          {!activePageId ? (
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:px-12 min-w-0 flex items-center justify-center bg-transparent">
              <div className="flex flex-col items-center justify-center text-slate-400 opacity-80 transition-all hover:scale-105 duration-300">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4">
                  <Layout className="w-12 h-12 md:w-16 md:h-16 text-indigo-200" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-center px-4 font-bold text-slate-500 tracking-wide">Pilih atau buat halaman untuk memulai.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0 h-full">

              {/* Note Header / Title */}
              <div className="bg-white/60 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0 gap-4">
                <input
                  type="text"
                  placeholder="Judul Catatan..."
                  value={activePage?.title || ''}
                  onChange={(e) => updateActivePage('title', e.target.value)}
                  className="text-2xl font-bold text-slate-800 border-none outline-none bg-transparent placeholder:text-slate-300 transition-colors focus:text-indigo-900 w-full"
                />
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] whitespace-nowrap font-bold px-3 py-1.5 rounded-full border transition-colors ${saveStatus === 'Menyimpan...' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {saveStatus}
                  </span>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* MAIN Toolbar (Google Docs / Word Style) */}
              <div className="flex flex-col border-b border-slate-200/50 bg-white/70 backdrop-blur-xl sticky top-0 z-20 shrink-0 shadow-sm">

                {/* Top Row: Formatting */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 px-4 justify-start overflow-x-auto custom-scrollbar">

                  {/* Font Style Select */}
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <select
                      value={currentFont}
                      onChange={(e) => {
                        setCurrentFont(e.target.value);
                        execCommand(e, 'fontName', e.target.value);
                      }}
                      className="bg-transparent text-slate-700 text-xs font-semibold focus:ring-0 outline-none cursor-pointer p-1.5 min-w-[120px]"
                      title="Pilih Font"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Georgia">Georgia</option>
                    </select>

                    <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>

                    {/* Font Size Select */}
                    <select
                      value={currentFontSize}
                      onChange={(e) => {
                        setCurrentFontSize(e.target.value);
                        execCommand(e, 'fontSize', e.target.value);
                      }}
                      className="bg-transparent text-slate-700 text-xs font-semibold focus:ring-0 outline-none cursor-pointer p-1.5"
                      title="Ukuran Font"
                    >
                      <option value="1">Sangat Kecil</option>
                      <option value="2">Kecil</option>
                      <option value="3">Normal</option>
                      <option value="4">Sedang</option>
                      <option value="5">Besar</option>
                      <option value="6">Sangat Besar</option>
                      <option value="7">Raksasa</option>
                    </select>
                  </div>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  {/* History & Clear Formatting */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button onMouseDown={(e) => execCommand(e, 'undo')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Undo (Ctrl+Z)"><Undo className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'redo')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Redo (Ctrl+Y)"><Redo className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button onMouseDown={(e) => { e.preventDefault(); if (editorRef.current) { editorRef.current.focus(); document.execCommand('removeFormat', false, null); document.execCommand('formatBlock', false, 'DIV'); handleEditorInput(); } }} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Hapus Semua Format Teks"><RemoveFormatting className="w-4 h-4" /></button>
                  </div>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  {/* Heading Options */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'H1')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'H2')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
                  </div>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  {/* Text Formatting */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button onMouseDown={(e) => execCommand(e, 'bold')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm font-bold tooltip" title="Cetak Tebal (Bold)"><Bold className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'italic')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm italic tooltip" title="Cetak Miring (Italic)"><Italic className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'underline')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm underline tooltip" title="Garis Bawah (Underline)"><Underline className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'strikeThrough')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm line-through tooltip" title="Coret (Strikethrough)"><Strikethrough className="w-4 h-4" /></button>
                  </div>

                  {/* Colors */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-1">
                    <label className="p-1.5 hover:bg-white rounded-md text-indigo-600 transition-all shadow-sm tooltip relative cursor-pointer" title="Warna Teks">
                      <Type className="w-4 h-4 pointer-events-none" />
                      <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => {
                          if (editorRef.current) editorRef.current.focus();
                          execCommand(e, 'foreColor', e.target.value);
                        }}
                      />
                    </label>

                    <label className="p-1.5 hover:bg-white rounded-md text-amber-500 transition-all shadow-sm tooltip relative cursor-pointer" title="Warna Latar (Highlight)">
                      <PaintBucket className="w-4 h-4 pointer-events-none" />
                      <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => {
                          if (editorRef.current) editorRef.current.focus();
                          execCommand(e, 'hiliteColor', e.target.value);
                        }}
                      />
                    </label>
                  </div>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  {/* Alignment */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button onMouseDown={(e) => execCommand(e, 'justifyLeft')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Rata Kiri"><AlignLeft className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'justifyCenter')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Rata Tengah"><AlignCenter className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'justifyRight')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Rata Kanan"><AlignRight className="w-4 h-4" /></button>
                  </div>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  {/* Lists, Quotes & Links */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                    <button onMouseDown={(e) => execCommand(e, 'insertUnorderedList')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Bullet List"><List className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'insertOrderedList')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
                    <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'BLOCKQUOTE')} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-all shadow-sm tooltip" title="Blockquote"><Quote className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-300 mx-1 self-center"></div>
                    <button onMouseDown={handleInsertLink} className="p-1.5 hover:bg-white rounded-md text-indigo-600 transition-all shadow-sm tooltip" title="Sisipkan Tautan (Link)"><Link className="w-4 h-4" /></button>
                    <button onMouseDown={handleInsertCheckbox} className="p-1.5 hover:bg-white rounded-md text-emerald-600 transition-all shadow-sm tooltip" title="Buat To-Do List Baru"><CheckSquare className="w-4 h-4" /></button>

                    {/* Line Spacing Select */}
                    <select
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(e.target.value)}
                      className="bg-transparent text-slate-600 text-xs font-semibold focus:ring-0 outline-none cursor-pointer p-1 ml-1"
                      title="Jarak Baris (Spasi)"
                    >
                      <option value="leading-none">Spasi 1.0</option>
                      <option value="leading-snug">Spasi 1.15</option>
                      <option value="leading-relaxed">Spasi 1.5</option>
                      <option value="leading-loose">Spasi 2.0</option>
                    </select>
                  </div>

                </div>

                {/* Bottom Row: Advanced Word Features */}
                <div className="flex flex-wrap items-center gap-3 p-2 px-4 bg-slate-50/80 border-t border-slate-100 text-xs font-semibold text-slate-600 overflow-x-auto custom-scrollbar">
                  <div className="flex items-center gap-1.5 mr-2 text-indigo-700">
                    <Palette className="w-4 h-4" /> <span className="hidden md:inline">Sisipkan:</span>
                  </div>

                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50 cursor-pointer" title="Sisipkan Gambar dari Komputer">
                    <ImageIcon className="w-3.5 h-3.5" /> Gambar
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                  </button>


                  <div className="w-px h-4 bg-slate-300 mx-1"></div>

                  {/* Layout & Tools */}
                  <button
                    onClick={() => setPageOrientation(prev => prev === 'potrait' ? 'landscape' : 'potrait')}
                    className={`flex items-center gap-1.5 transition-colors p-1 rounded cursor-pointer ${pageOrientation === 'landscape' ? 'bg-indigo-100 text-indigo-700' : 'hover:text-indigo-600 hover:bg-indigo-50'}`}
                    title="Ubah Orientasi Halaman (Potrait/Landscape)"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Orientasi ({pageOrientation === 'potrait' ? 'Potrait' : 'Landscape'})
                  </button>

                  <div className="w-px h-4 bg-slate-300 mx-1"></div>

                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 hover:text-white transition-colors p-1.5 px-2 rounded-md bg-indigo-600 text-white shadow-sm cursor-pointer ml-auto" title="Cetak atau Simpan PDF">
                    <Printer className="w-3.5 h-3.5" /> Export PDF
                  </button>
                </div>

              </div>

              {/* Paper Editor Content (Like Google Docs page) */}
              <div
                className="flex-1 overflow-y-auto w-full custom-scrollbar bg-slate-100 flex justify-center items-start p-4 md:p-8"
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
              >
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onKeyDown={handleKeyDown}
                  className={editorClasses}
                  style={{
                    minHeight: `${PAGE_HEIGHT}px`,
                    height: 'max-content',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    wordWrap: 'break-word',
                    overflowWrap: 'anywhere',
                    marginBottom: '40px'
                  }}
                  data-placeholder="Mulai menulis jurnal, gagasan, atau tugasmu di sini..."
                />

                {/* Floating Popup "Jadikan Tugas" */}
                {showTaskPopup && (
                  <div
                    className="fixed z-50 animate-fade-in-up bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-indigo-600 transition-colors"
                    style={{ left: `${popupPos.x}px`, top: `${popupPos.y}px`, transform: 'translateX(-50%)' }}
                    onClick={saveToMatrix}
                    onMouseDown={(e) => e.preventDefault()} // Prevent editor blur
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Kirim ke Balance Matrix</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Floating Action Button for smaller screens or quick access */}
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 flex gap-2">
            <button
              onClick={handleOpenModal}
              className="w-12 h-12 md:w-14 items-center md:h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all flex justify-center cursor-pointer group"
              title="Buat Catatan Baru"
            >
              <Plus className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </button>
          </div>
        </main>


        {/* MODAL BUAT CATATAN BARU */}
        {
          isModalOpen && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md transform transition-all animate-fade-in-up border border-white spatial-shadow overflow-hidden">
                {/* Neko Speech Banner */}
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 px-6 py-4 flex items-center gap-3">
                  <NekoMascotMini className="w-12 h-12 shrink-0" />
                  <div className="relative bg-white border border-indigo-100 rounded-2xl rounded-tl-none px-4 py-2 shadow">
                    <div className="absolute -top-2.5 left-3 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-white" />
                    <p className="text-sm font-bold text-indigo-600 italic">"Mau nulis apa hari ini? Nyaa~ 📚"</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <FilePlus className="w-6 h-6 text-indigo-600" />
                      Buat Catatan Baru
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={confirmCreateNewPage}>
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Nama Catatan / File</label>
                      <input
                        type="text"
                        value={newPageTitle}
                        onChange={(e) => setNewPageTitle(e.target.value)}
                        placeholder="Misal: Catatan Rapat BEM"
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium transition-all"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                      >
                        Buat Dokumen
                      </button>
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
