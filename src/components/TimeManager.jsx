// src/components/TimeManager.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { DragDropContext } from "@hello-pangea/dnd";

// SATUKAN SEMUA IMPORT ICON KE DALAM SATU BARIS INI:
import { 
  Plus, CheckCircle, Target, MoveRight, Layers, Clock, BellRing,
  AlertTriangle, AlertCircle, Trash2 
} from "lucide-react";

// Import Komponen Anak yang sudah dipecah
import DeadlineTracker from "./TimeManager/DeadlineTracker";
import WeeklyCalendar from "./TimeManager/WeeklyCalendar";
import EisenhowerMatrix from "./TimeManager/EisenhowerMatrix";

const VALID_QUADRANTS = [
  "urgent-important",
  "not-urgent-important",
  "urgent-not-important",
  "not-urgent-not-important",
  "unassigned",
];

const LEGACY_QUADRANT_MAP = {
  q1: "urgent-important",
  q2: "not-urgent-important",
  q3: "urgent-not-important",
  q4: "not-urgent-not-important",
  "urgent-academic": "unassigned",
};

// KATEGORI PERAN MAHASISWA UNTUK SETIAP TUGAS / BLOK WAKTU
const CATEGORY_OPTIONS = [
  { id: "academic", label: "Akademik", short: "Akademik" },
  { id: "organization", label: "Organisasi", short: "Organisasi" },
  { id: "committee", label: "Kepanitiaan", short: "Kepanitiaan" },
  { id: "work", label: "Kerja Part-time", short: "Kerja" },
  { id: "personal", label: "Pribadi / Keluarga", short: "Pribadi" },
  { id: "project", label: "Project / Skripsi", short: "Project" },
];

const getDefaultCategory = () => "academic";

const normalizeQuadrant = (quadrant) => {
  const mapped = LEGACY_QUADRANT_MAP[quadrant] || quadrant;
  return VALID_QUADRANTS.includes(mapped) ? mapped : "unassigned";
};

const getLocalDateKey = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Math.floor(Math.random() * 1e9)}`;

const TimeManager = () => {
  // --- 1. STATE MANAGEMENT (Tetap sama) ---
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("matrix_tasks");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((t) => ({
        ...t,
        quadrant: normalizeQuadrant(t.quadrant),
        category: t.category || getDefaultCategory(),
      }));
    }
    return [];
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEnergy, setNewTaskEnergy] = useState("1");
  const [newTaskCategory, setNewTaskCategory] = useState(getDefaultCategory());

  const [showAddModal, setShowAddModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledBlocks, setScheduledBlocks] = useState(() => {
    const saved = localStorage.getItem("time_blocks");
    if (saved) {
      const parsed = JSON.parse(saved);
      const migrated = {};
      for (const date in parsed) {
        migrated[date] = parsed[date].map((b) => ({
          ...b,
          quadrant: normalizeQuadrant(b.quadrant),
          category: b.category || getDefaultCategory(),
        }));
      }
      return migrated;
    }
    return {};
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [taskToSchedule, setTaskToSchedule] = useState(null);
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [scheduleDate, setScheduleDate] = useState(getLocalDateKey());
  const [academicSchedule, setAcademicSchedule] = useState(() => {
    try {
      const raw = localStorage.getItem("stuprod_academic_schedule");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [globalGoal, setGlobalGoal] = useState(() => {
    return localStorage.getItem("stuprod_global_goal") || "Ketik target IPK/Organisasimu semester ini...";
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    localStorage.setItem("stuprod_global_goal", globalGoal);
  }, [globalGoal]);

  const [notif, setNotif] = useState(null);
  const [appSettings, setAppSettings] = useState(() => JSON.parse(localStorage.getItem("stuprod_settings") || "{}"));
  const notifyAudioRef = useRef(null);

  const [synergyState, setSynergyState] = useState(() => {
    return localStorage.getItem("stuprod_balance_state") || "balanced";
  });

  const MAX_DAILY_ENERGY = synergyState === "buffed" ? 13 : synergyState === "debuffed" ? 7 : 10;

  const [deadlineTasks, setDeadlineTasks] = useState(() => {
    const saved = localStorage.getItem("stuprod_tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [newDeadlineTask, setNewDeadlineTask] = useState("");
  const [newDeadlineTime, setNewDeadlineTime] = useState("");
  const [activeAlert, setActiveAlert] = useState(null);

  const triggerNotification = useCallback((task) => {
    const notifEnabled = appSettings.notifications !== false && appSettings.urgentReminders !== false;
    if (!notifEnabled) return;
    if (notifyAudioRef.current) {
      notifyAudioRef.current.play().catch((e) => console.log("Audio autoplay prevented:", e));
    }
    setActiveAlert(task);
  }, [appSettings]);

  // --- 2. EFFECTS (Tetap sama) ---
  useEffect(() => {
    notifyAudioRef.current = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3");
    return () => {
      if (notifyAudioRef.current) {
        notifyAudioRef.current.pause();
        notifyAudioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    const syncSettings = () => {
      setAppSettings(JSON.parse(localStorage.getItem("stuprod_settings") || "{}"));
      setSynergyState(localStorage.getItem("stuprod_balance_state") || "balanced");
    };
    const syncSchedule = () => {
      try {
        const raw = localStorage.getItem("stuprod_academic_schedule");
        setAcademicSchedule(raw ? JSON.parse(raw) : []);
      } catch {
        setAcademicSchedule([]);
      }
    };
    window.addEventListener("storage", (e) => {
      if (e.key === "stuprod_settings" || e.key === "stuprod_balance_state") {
        syncSettings();
      }
      if (!e.key || e.key === "stuprod_academic_schedule") {
        syncSchedule();
      }
    });
    // initial sync
    syncSettings();
    syncSchedule();
    return () => {
      window.removeEventListener("storage", syncSettings);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("stuprod_tasks", JSON.stringify(deadlineTasks));
  }, [deadlineTasks]);

  useEffect(() => {
    const notifEnabled = appSettings.notifications !== false && appSettings.urgentReminders !== false;
    if (!notifEnabled) return undefined;

    const checkDeadlines = () => {
      const now = new Date().getTime();
      let updated = false;
      const newTasks = deadlineTasks.map((t) => {
        if (!t.completed && !t.notified && t.deadline) {
          const deadlineTime = new Date(t.deadline).getTime();
          const timeDiff = deadlineTime - now;
          if (timeDiff > 0 && timeDiff <= 7200000) {
            triggerNotification(t);
            updated = true;
            return { ...t, notified: true };
          }
        }
        return t;
      });
      if (updated) {
        setDeadlineTasks(newTasks);
      }
    };

    const interval = setInterval(checkDeadlines, 30000);
    return () => clearInterval(interval);
  }, [deadlineTasks, appSettings, triggerNotification]);

  // --- HANDLERS (Tetap sama) ---
  const handleAddDeadlineTask = (e) => {
    e.preventDefault();
    if (!newDeadlineTask.trim() || !newDeadlineTime) return;
    setDeadlineTasks([
      ...deadlineTasks,
      { id: createId(), text: newDeadlineTask, deadline: newDeadlineTime, completed: false, completedAt: null, notified: false, createdAt: new Date().toISOString() },
    ]);
    setNewDeadlineTask("");
    setNewDeadlineTime("");
  };

  const toggleDeadlineTask = (id) => {
    setDeadlineTasks(
      deadlineTasks.map((t) => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t)
    );
  };

  const deleteDeadlineTask = (id) => setDeadlineTasks(deadlineTasks.filter((t) => t.id !== id));

  const transferDeadlineTask = (dt) => {
    const newTask = { 
      id: createId(), 
      title: dt.text, 
      quadrant: "unassigned", 
      energy: 2, 
      tag: "Deadline", 
      completed: false,
      category: getDefaultCategory(),
    };
    setTasks([...tasks, newTask]);
    setTaskToSchedule(newTask);
    setShowScheduleModal(true);
    showNotification("Tugas dikirim ke Agenda & Kalender!");
  };

  const calculateDeadlineStatus = (deadline) => {
    const timeDiff = new Date(deadline).getTime() - new Date().getTime();
    if (timeDiff < 0) return { label: "Terlewat", color: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/30", bg: "bg-rose-50 dark:bg-rose-500/10" };
    if (timeDiff <= 7200000) return { label: "Mendesak (< 2 Jam)", color: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-500/30", bg: "bg-orange-50 dark:bg-orange-500/10" };
    if (timeDiff <= 86400000) return { label: "Hari Ini", color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/30", bg: "bg-amber-50 dark:bg-amber-500/10" };
    return { label: "Aman", color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30", bg: "bg-emerald-50 dark:bg-emerald-500/10" };
  };

  useEffect(() => { localStorage.setItem("matrix_tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("time_blocks", JSON.stringify(scheduledBlocks)); }, [scheduledBlocks]);

  const showNotification = (message) => {
    setNotif(message);
    setTimeout(() => setNotif(null), 3000);
  };

  const clearCompletedTasks = () => {
    setTasks(tasks.filter((t) => !t.completed));
    setDeadlineTasks(deadlineTasks.filter((t) => !t.completed));
    showNotification("Semua tugas selesai telah dibersihkan!");
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = { 
      id: createId(), 
      title: newTaskTitle, 
      quadrant: "unassigned", 
      energy: parseInt(newTaskEnergy), 
      tag: "Umum", 
      completed: false,
      category: newTaskCategory || getDefaultCategory(),
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskEnergy("1");
    setNewTaskCategory(getDefaultCategory());
    setShowAddModal(false);
    setTaskToSchedule(newTask);
    setShowScheduleModal(true);
  };

  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    const newBlocks = { ...scheduledBlocks };
    Object.keys(newBlocks).forEach((date) => { newBlocks[date] = newBlocks[date].filter((b) => b.taskId !== taskId); });
    setScheduledBlocks(newBlocks);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceQuad = result.source.droppableId;
    const destQuad = result.destination.droppableId;

    if (sourceQuad === destQuad) {
      const items = Array.from(tasks.filter((t) => t.quadrant === sourceQuad));
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      const newTasks = tasks.map((t) => t.quadrant === sourceQuad ? items.shift() : t);
      setTasks(newTasks);
    } else {
      setTasks(tasks.map((t) => t.id === result.draggableId ? { ...t, quadrant: destQuad } : t));
    }
  };

  const openScheduleModal = (task) => {
    setTaskToSchedule({ ...task });
    setScheduleTime("08:00");
    setScheduleDate(getLocalDateKey());
    setShowScheduleModal(true);
  };

  const confirmSchedule = (e) => {
    e.preventDefault();
    if (!taskToSchedule || !scheduleDate || !scheduleTime) return;
    const dateStr = scheduleDate;
    const newBlock = { 
      id: createId(), 
      taskId: taskToSchedule.id, 
      title: taskToSchedule.title, 
      time: scheduleTime || "00:00", 
      quadrant: taskToSchedule.quadrant || "unassigned", 
      energy: taskToSchedule.energy || 1, 
      completed: false,
      category: taskToSchedule.category || getDefaultCategory(),
    };
    setScheduledBlocks({
      ...scheduledBlocks,
      [dateStr]: [...(scheduledBlocks[dateStr] || []), newBlock].sort((a, b) => a.time.localeCompare(b.time)),
    });
    setShowScheduleModal(false);
    showNotification(`Tugas dijadwalkan pada jam ${scheduleTime} `);
    setTimeout(() => setTaskToSchedule(null), 300);
  };

  const removeBlock = (dateStr, blockId) => {
    setScheduledBlocks({ ...scheduledBlocks, [dateStr]: scheduledBlocks[dateStr].filter((b) => b.id !== blockId) });
  };

  const quadrants = [
    { id: "urgent-important", title: "Lakukan Sekarang", icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20" },
    { id: "not-urgent-important", title: "Jadwalkan", icon: Target, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" },
    { id: "urgent-not-important", title: "Delegasikan/Bantuan", icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
    { id: "not-urgent-not-important", title: "Tunda/Hapus", icon: Trash2, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700" },
  ];

  const getDayFormatted = (date) => {
    return date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const dateStrKey = getLocalDateKey(currentDate);
  const todayBlocks = scheduledBlocks[dateStrKey] || [];

  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const isSameDay = (date1, date2) => {
    return (date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate());
  };

  const calculateDailyEnergy = (blocks) => {
    return blocks.reduce((acc, block) => acc + (block.energy || 1), 0);
  };

  const currentDailyEnergy = calculateDailyEnergy(todayBlocks);
  const isBurnout = currentDailyEnergy > MAX_DAILY_ENERGY;

  return (
    <>
      <div className="min-h-full flex flex-col p-4 md:p-8 animate-fade-in pb-32">
        <div className="w-full max-w-6xl mx-auto space-y-8">
          {/* HEADER */}
          <div className="animated-gradient-border liquid-glass dark:bg-slate-900/60 dark:border-slate-700/50 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 spatial-shadow transition-colors">
            <div className="flex items-center gap-5 z-10 relative">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-500/30 shadow-inner">
                <Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Time &amp; Task Hub</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Prioritaskan di Matrix, Eksekusi di Kalender.</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md shadow-indigo-600/20 w-full md:w-auto justify-center cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Tambah Agenda Baru
            </button>
          </div>

          {/* RENDER MODULAR COMPONENTS */}
          <DeadlineTracker
            deadlineTasks={deadlineTasks}
            newDeadlineTask={newDeadlineTask}
            setNewDeadlineTask={setNewDeadlineTask}
            newDeadlineTime={newDeadlineTime}
            setNewDeadlineTime={setNewDeadlineTime}
            handleAddDeadlineTask={handleAddDeadlineTask}
            toggleDeadlineTask={toggleDeadlineTask}
            deleteDeadlineTask={deleteDeadlineTask}
            transferDeadlineTask={transferDeadlineTask}
            calculateDeadlineStatus={calculateDeadlineStatus}
          />

          <DragDropContext onDragEnd={onDragEnd}>
            <WeeklyCalendar
              next7Days={next7Days}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              isSameDay={isSameDay}
              scheduledBlocks={scheduledBlocks}
              getDayFormatted={getDayFormatted}
              todayBlocks={todayBlocks}
              isBurnout={isBurnout}
              currentDailyEnergy={currentDailyEnergy}
              MAX_DAILY_ENERGY={MAX_DAILY_ENERGY}
              synergyState={synergyState}
              tasks={tasks}
              quadrants={quadrants}
              removeBlock={removeBlock}
              dateStrKey={dateStrKey}
              globalGoal={globalGoal}
              setGlobalGoal={setGlobalGoal}
              isEditingGoal={isEditingGoal}
              setIsEditingGoal={setIsEditingGoal}
              academicSchedule={academicSchedule}
            />

            <EisenhowerMatrix
              clearCompletedTasks={clearCompletedTasks}
              quadrants={quadrants}
              tasks={tasks}
              openScheduleModal={openScheduleModal}
              toggleTaskStatus={toggleTaskStatus}
              deleteTask={deleteTask}
            />
          </DragDropContext>
        </div>
      </div>

      {/* MODALS RENDERED HERE (Tidak Berubah) */}
      {/* ... [Sisa kode modal add task, modal jadwal, notif toast, dan notif alert tidak berubah dari aslinya] ... */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-fade-in-up border dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Buat Agenda Baru</h3>
            <form onSubmit={handleAddTask}>
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Nama Agenda / Tugas</label>
                  <input type="text" required value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Contoh: Meeting dengan Klien" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" autoFocus />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500" /> Kuras Energi</label>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-3">Berapa koin mental yang dibutuhkan untuk agenda ini?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ val: "1", label: "Ringan", icon: "🟢", desc: "1 Koin" }, { val: "2", label: "Sedang", icon: "🟡", desc: "2 Koin" }, { val: "3", label: "Berat", icon: "🔴", desc: "3 Koin" }].map((opt) => (
                      <button key={opt.val} type="button" onClick={() => setNewTaskEnergy(opt.val)} className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer ${newTaskEnergy === opt.val ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-200" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"} `}>
                        <span className="text-xl mb-1">{opt.icon}</span><span className={`text-xs font-bold ${newTaskEnergy === opt.val ? "text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300"} `}>{opt.label}</span><span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${newTaskEnergy === opt.val ? "text-indigo-500 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"} `}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 mt-4">
                    Peran Utama Agenda
                  </label>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-3">
                    Tandai agenda ini milik peran yang mana (kuliah, organisasi, kerja, atau pribadi).
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNewTaskCategory(opt.id)}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          newTaskCategory === opt.id
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-200"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <span className={`text-xs font-bold ${
                          newTaskCategory === opt.id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"
                        }`}>
                          {opt.label}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                          newTaskCategory === opt.id ? "text-indigo-500 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {opt.short}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 cursor-pointer">Simpan <MoveRight className="w-4 h-4" /></button>
              </div>
            </form>
          </div>
        </div>, document.body)}

      {showScheduleModal && taskToSchedule && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg p-8 animate-fade-in-up border border-indigo-50 dark:border-slate-700">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Jadwalkan Tugas</h3>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2">"{taskToSchedule.title}"</p>
            </div>
            <form onSubmit={confirmSchedule}>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">PILIH TANGGAL</label>
                  <div className="relative"><input type="date" required value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-900 dark:text-indigo-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold transition-all shadow-sm" /></div>
                </div>
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">PUKUL BERAPA?</label>
                  <div className="relative"><input type="time" required value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-900 dark:text-indigo-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold transition-all shadow-sm" /></div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="px-6 py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"><CheckCircle className="w-5 h-5" /> Masukkan Kalender</button>
              </div>
            </form>
          </div>
        </div>, document.body)}

      {notif && createPortal(<div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl animate-fade-in-up z-[300] flex items-center gap-3 font-bold"><CheckCircle className="w-5 h-5 text-emerald-400" />{notif}</div>, document.body)}

      {activeAlert && createPortal(
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-[2rem] p-8 shadow-2xl border-4 border-orange-100 dark:border-slate-700 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 text-orange-500 dark:text-orange-400 rounded-full flex items-center justify-center mb-6"><BellRing className="w-10 h-10 animate-pulse" /></div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Peringatan Deadline!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Tugas <strong className="text-slate-800 dark:text-slate-200">{activeAlert.text}</strong> harus selesai dalam waktu kurang dari 2 Jam!</p>
            <div className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-8 flex justify-between items-center text-left">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Tenggat Waktu</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{new Date(activeAlert.deadline).toLocaleString("id-ID", { timeStyle: "short", dateStyle: "medium" })}</p>
              </div>
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <button onClick={() => setActiveAlert(null)} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 cursor-pointer hover:scale-105">Selesaikan Nanti (Tutup)</button>
          </div>
        </div>, document.body)}
    </>
  );
};

export default TimeManager;