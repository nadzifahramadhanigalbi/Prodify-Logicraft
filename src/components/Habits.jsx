import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Plus,
  Check,
  Zap,
  Brain,
  Feather,
  Flame,
  Star,
  Moon,
  Info,
  X,
  Target,
  ChevronLeft,
  ChevronRight,
  Sun,
  LayoutGrid,
} from "lucide-react";
import { NekoMascotMini, NekoMascotFull } from './NekoMascot';

const formatDateStr = (dateObj) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
};

const Habits = () => {
  const [activeDate, setActiveDate] = useState(formatDateStr(new Date()));

  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem("stuprod_habits_v4");
    if (saved) return JSON.parse(saved);

    // Default initialization (Empty State)
    return [];
  });

  const [balanceState, setBalanceState] = useState(() => {
    return localStorage.getItem("stuprod_balance_state") || "balanced"; // buffed, debuffed, balanced
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("🌟");
  const [newHabitPillar, setNewHabitPillar] = useState("cognitive");
  const [newHabitTarget, setNewHabitTarget] = useState(1);

  const [habitNotes, setHabitNotes] = useState(() => {
    const saved = localStorage.getItem("stuprod_habit_notes");
    return saved ? JSON.parse(saved) : {};
  });

  const [activeDetailHabit, setActiveDetailHabit] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    localStorage.setItem("stuprod_habit_notes", JSON.stringify(habitNotes));
  }, [habitNotes]);

  useEffect(() => {
    localStorage.setItem("stuprod_habits_v4", JSON.stringify(habits));
    calculateSynergy();
  }, [habits]);

  const getCurrentCount = (habit) => {
    return habit.history?.[activeDate] || 0;
  };

  const calculateSynergy = () => {
    const completed = habits.filter((h) => getCurrentCount(h) >= h.targetCount);
    const hasCog = completed.some((h) => h.pillar === "cognitive");
    const hasVit = completed.some((h) => h.pillar === "vitality");
    const hasMind = completed.some((h) => h.pillar === "mindfulness");

    let newState = "balanced";
    if (hasVit && hasMind) {
      newState = "buffed"; // Healthy & mindful = buffed energy
    } else if (hasCog && !hasVit && !hasMind) {
      newState = "debuffed"; // Only working, no health/mind bounds = burnout
    }

    setBalanceState(newState);
    localStorage.setItem("stuprod_balance_state", newState);
  };

  const handleDateChange = (direction) => {
    // direction is -1 (prev day) or 1 (next day)
    const currentDateObj = new Date(activeDate);
    currentDateObj.setDate(currentDateObj.getDate() + direction);

    const newDateStr = formatDateStr(currentDateObj);
    const todayStr = formatDateStr(new Date());

    // Prevent going into the future beyond today
    if (newDateStr > todayStr && direction > 0) return;

    setActiveDate(newDateStr);
  };

  // --- EXPLICIT CLICK-TO-COMPLETE LOGIC ---
  const [confirmCompleteId, setConfirmCompleteId] = useState(null);
  const [confirmUndoId, setConfirmUndoId] = useState(null);

  const POPULAR_ROUTINES = [
    // --- UMUM & KESEHATAN (Mahasiswa Umum) ---
    {
      id: "pr_u1",
      icon: "🌅",
      title: "Bangun Pagi Konsisten",
      pillar: "vitality",
      target: 1,
      desc: "Bangun jam 5 pagi tanpa snooze",
    },
    {
      id: "pr_u2",
      icon: "💧",
      title: "Hidrasi Penuh",
      pillar: "vitality",
      target: 8,
      desc: "Minum 8 gelas air / hari",
    },
    {
      id: "pr_u3",
      icon: "🧠",
      title: "Review Flashcard Belajar",
      pillar: "cognitive",
      target: 3,
      desc: "Sesi spaced repetition materi kelas",
    },
    {
      id: "pr_u4",
      icon: "🧘",
      title: "Meditasi Pagi",
      pillar: "mindfulness",
      target: 1,
      desc: "Duduk tenang 5 menit sebelum ngampus",
    },

    // --- ANAK IT / ILKOM ---
    {
      id: "pr_it1",
      icon: "💻",
      title: "Latihan Ngoding (Leet)",
      pillar: "cognitive",
      target: 1,
      desc: "Kerjakan 1 algoritma untuk asah logika",
    },
    {
      id: "pr_it2",
      icon: "🚀",
      title: "EksplorTech Stack",
      pillar: "cognitive",
      target: 1,
      desc: "Baca dokumentasi framework baru 15 menit",
    },

    // --- ANAK KESENIAN (Seni Rupa, Musik, Tari, Desain) ---
    {
      id: "pr_art1",
      icon: "🎨",
      title: "Sketsa / Doodling",
      pillar: "cognitive",
      target: 1,
      desc: "Latihan gambar 1 sketsa anatomi / observasi",
    },
    {
      id: "pr_art2",
      icon: "🎵",
      title: "Latihan Instrumen/Vokal",
      pillar: "cognitive",
      target: 1,
      desc: "Main tangga nada / pemanasan vokal 30 menit",
    },
    {
      id: "pr_art3",
      icon: "🕺",
      title: "Pemanasan Koreografi",
      pillar: "vitality",
      target: 1,
      desc: "Stretching & recall koreografi 15 menit",
    },
    {
      id: "pr_art4",
      icon: "🎭",
      title: "Cari Referensi Karya/Moodboard",
      pillar: "mindfulness",
      target: 1,
      desc: "Kumpulkan inspirasi visual/audio tanpa distraksi",
    },

    // --- ANAK EKONOMI & BISNIS ---
    {
      id: "pr_eco1",
      icon: "📈",
      title: "Update Berita Ekonomi/Pasar",
      pillar: "cognitive",
      target: 1,
      desc: "Baca berita makro/saham pagi hari (CNBC, dll)",
    },
    {
      id: "pr_eco2",
      icon: "🧮",
      title: "Bedah Studi Kasus Bisnis",
      pillar: "cognitive",
      target: 1,
      desc: "Analisis laporan keuangan / strategi 1 brand",
    },
    {
      id: "pr_eco3",
      icon: "💡",
      title: "Brainstorming Ide Usaha",
      pillar: "cognitive",
      target: 1,
      desc: "Tulis 5 ide pain-point & draf solusi bisnis",
    },

    // --- ANAK PENDIDIKAN / KEGURUAN ---
    {
      id: "pr_edu1",
      icon: "📝",
      title: "Rancang Lesson Plan",
      pillar: "cognitive",
      target: 1,
      desc: "Buat 1 draf RPP / alat peraga ajar interaktif",
    },
    {
      id: "pr_edu2",
      icon: "🗣️",
      title: "Latihan Microteaching",
      pillar: "cognitive",
      target: 1,
      desc: "Latihan intonasi & presentasi kelas depan kaca",
    },
    {
      id: "pr_edu3",
      icon: "📚",
      title: "Review Jurnal Pedagogi",
      pillar: "cognitive",
      target: 1,
      desc: "Baca 1 artikel metode/psikologi pendidikan anak",
    },

    // --- ANAK KEOLAHRAGAAN (FIK) ---
    {
      id: "pr_sport1",
      icon: "🏃‍♂️",
      title: "Latihan Fisik Inti",
      pillar: "vitality",
      target: 1,
      desc: "Workout 45 menit untuk maintenance kebugaran",
    },
    {
      id: "pr_sport2",
      icon: "💪",
      title: "Stretching Khusus",
      pillar: "vitality",
      target: 2,
      desc: "Peregangan otot preventif cedera sesudah latihan",
    },
    {
      id: "pr_sport3",
      icon: "🥗",
      title: "Cek Kalori & Makro Nutrisi",
      pillar: "vitality",
      target: 1,
      desc: "Catat asupan protein presisi agar target tercapai",
    },
    {
      id: "pr_sport4",
      icon: "🧊",
      title: "Cold Exposure / Recovery",
      pillar: "vitality",
      target: 1,
      desc: "Mandi es/air dingin untuk meredakan inflamasi otot",
    },

    // --- ANAK TEKNIK (Sipil, Mesin, Elektro, Arsi, dll) ---
    {
      id: "pr_eng1",
      icon: "📐",
      title: "Latihan Kalkulus/Fisika Dasar",
      pillar: "cognitive",
      target: 1,
      desc: "Selesaikan 2 soal hitungan mekanika/arus numerik",
    },
    {
      id: "pr_eng2",
      icon: "🏗️",
      title: "Eksplor Software CAD/BIM",
      pillar: "cognitive",
      target: 1,
      desc: "Latihan tool set di AutoCAD, SolidWorks, Revit, dll",
    },
    {
      id: "pr_eng3",
      icon: "🔌",
      title: "Oprek Mikrokontroler/Rangkaian",
      pillar: "cognitive",
      target: 1,
      desc: "Simulasi Arduino/Proteus atau solder mini project",
    },

    // --- ANAK HUKUM ---
    {
      id: "pr_law1",
      icon: "⚖️",
      title: "Bedah Ratio Decidendi",
      pillar: "cognitive",
      target: 1,
      desc: "Analisis landasan hukum dari 1 putusan pengadilan",
    },
    {
      id: "pr_law2",
      icon: "辩",
      title: "Latihan Legal Drafting/Debat",
      pillar: "cognitive",
      target: 1,
      desc: "Susun kerangka argumen legal standing isu terkini",
    },
    {
      id: "pr_law3",
      icon: "📖",
      title: "Hafalan Pasal Krusial",
      pillar: "cognitive",
      target: 2,
      desc: "Review mendalam 5 pasal penting (KUHPer, KUHP, dll)",
    },

    // --- ANAK FISIP (HI, SosPol, Ilkom, dll) ---
    {
      id: "pr_soc1",
      icon: "📰",
      title: "Analisis Isu Geopolitik/Sosial",
      pillar: "cognitive",
      target: 1,
      desc: "Kritis bedah 1 artikel opini kebijakan publik/global",
    },
    {
      id: "pr_soc2",
      icon: "✍️",
      title: "Latihan Menulis Press Release / Opini",
      pillar: "cognitive",
      target: 1,
      desc: "Drafting 300 kata tanggapan fenomena komunikasi/sosial",
    },
    {
      id: "pr_soc3",
      icon: "🗣️",
      title: "Praktik Negosiasi/Diplomasi",
      pillar: "cognitive",
      target: 1,
      desc: "Simulasi roleplay Model UN (MUN) atau argumen kelompok",
    },

    // --- ANAK FMIPA (Matematika, Biologi, Kimia, Fisika) ---
    {
      id: "pr_sci1",
      icon: "🔬",
      title: "Review Teorema/Mekanisme",
      pillar: "cognitive",
      target: 1,
      desc: "Tulis & buktikan ulang 1 rumus sakti / jalur metabolisme",
    },
    {
      id: "pr_sci2",
      icon: "🧪",
      title: "Bedah Jurnal Sains Scopus",
      pillar: "cognitive",
      target: 1,
      desc: "Analisis setup eksperimen & hasil dari 1 paper riset Q1",
    },
    {
      id: "pr_sci3",
      icon: "📊",
      title: "Latihan Olah Data Statistik",
      pillar: "cognitive",
      target: 1,
      desc: "Visualisasi dataset eksperimen menggunakan R / Python / SPSS",
    },

    // --- ANAK KESEHATAN (Kedokteran, Keperawatan, Farmasi) ---
    {
      id: "pr_med1",
      icon: "⚕️",
      title: "Review Anatomi/Farmakologi",
      pillar: "cognitive",
      target: 2,
      desc: "Hafalkan sistem jaringan, letak tulang / list dosis obat kritis",
    },
    {
      id: "pr_med2",
      icon: "🩺",
      title: "Simulasi Anamnesis Kasus",
      pillar: "cognitive",
      target: 1,
      desc: "Baca, diagnosis, & buat timeline dari 1 clinical case (Skill Lab)",
    },

    // --- MINDFULNESS & ME-TIME (Semua Jurusan) ---
    {
      id: "pr_mind1",
      icon: "📓",
      title: "Gratitude Journaling",
      pillar: "mindfulness",
      target: 1,
      desc: "Tulis 3 pencapaian kecil & hal yang membuatmu tersenyum hari ini",
    },
    {
      id: "pr_mind2",
      icon: "📵",
      title: "Digital Detox Malam",
      pillar: "mindfulness",
      target: 1,
      desc: "1 jam sebelum tidur stop scrolling medsos / jauhi layar biru",
    },
    {
      id: "pr_mind3",
      icon: "☕",
      title: "Savoring Pagi Hari",
      pillar: "mindfulness",
      target: 1,
      desc: "Nikmati perlahan hangatnya sarapan/pagi tanpa pegang HP",
    },
  ];

  const handleApplyRoutine = (routine) => {
    const newHabit = {
      id:
        "routine_" +
        Date.now().toString() +
        Math.random().toString(36).substr(2, 5),
      title: routine.title,
      icon: routine.icon,
      streak: 0,
      history: {},
      targetCount: routine.target,
      pillar: routine.pillar,
    };
    setHabits([...habits, newHabit]);

    // Optional: Flash success toast
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const handleHabitClick = (id) => {
    const habit = habits.find((h) => h.id === id);
    if (getCurrentCount(habit) >= habit.targetCount) {
      setConfirmUndoId(id);
      return;
    }

    // Open confirmation modal
    setConfirmCompleteId(id);
  };

  const executeCompletion = () => {
    if (confirmCompleteId) {
      incrementHabitCount(confirmCompleteId);
      setConfirmCompleteId(null);
    }
  };

  const cancelCompletion = () => {
    setConfirmCompleteId(null);
  };

  const executeUndo = () => {
    if (confirmUndoId) {
      decrementHabitCount(confirmUndoId);
      setConfirmUndoId(null);
    }
  };

  const cancelUndo = () => {
    setConfirmUndoId(null);
  };

  const decrementHabitCount = (id) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const currentCount = getCurrentCount(habit);
          if (currentCount <= 0) return habit;

          const newCount = currentCount - 1;
          const wasJustCompleted = currentCount === habit.targetCount;

          return {
            ...habit,
            history: {
              ...habit.history,
              [activeDate]: newCount,
            },
            streak: wasJustCompleted
              ? Math.max(0, habit.streak - 1)
              : habit.streak,
          };
        }
        return habit;
      }),
    );
  };

  const incrementHabitCount = (id) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const newCount = getCurrentCount(habit) + 1;
          const isJustCompleted = newCount === habit.targetCount;

          if (isJustCompleted) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2500);
          }

          return {
            ...habit,
            history: {
              ...habit.history,
              [activeDate]: newCount,
            },
            streak: isJustCompleted ? habit.streak + 1 : habit.streak,
          };
        }
        return habit;
      }),
    );
  };

  const resetHabitsMidnight = () => {
    /* Logic to reset all currentCounts to 0 would go here in a real app via a CRON job or date-diff check */
  };

  // ---------------------------------------------

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const newHabit = {
      id: Date.now().toString(),
      title: newHabitTitle,
      icon: newHabitIcon,
      streak: 0,
      history: {},
      targetCount: parseInt(newHabitTarget) || 1,
      pillar: newHabitPillar,
    };

    setHabits([...habits, newHabit]);
    setNewHabitTitle("");
    setNewHabitTarget(1);
    setShowAddModal(false);
  };

  const totalCompleted = habits.filter(
    (h) => getCurrentCount(h) >= h.targetCount,
  ).length;
  const showConstellation = totalCompleted > 0;

  const renderHabitItem = (habit) => {
    const isCompleted = getCurrentCount(habit) >= habit.targetCount;

    // Dynamic styling based on pillar
    let strokeColor = "border-slate-200 hover:border-slate-300";
    let bgChecked = "bg-slate-600 border-slate-600";
    let textChecked = "text-slate-900";
    let iconColor = "text-slate-400";
    let ringColor = "text-slate-300";

    if (habit.pillar === "cognitive") {
      strokeColor = isCompleted
        ? "border-blue-300 shadow-md bg-blue-50/50"
        : "border-slate-200 hover:border-blue-200 shadow-sm";
      bgChecked = isCompleted
        ? "bg-blue-600 border-blue-600"
        : "border-slate-300 hover:border-blue-400";
      textChecked = isCompleted ? "text-blue-900" : "text-slate-700";
      iconColor = isCompleted ? "text-blue-200" : "text-blue-400";
      ringColor = "text-blue-500";
    } else if (habit.pillar === "vitality") {
      strokeColor = isCompleted
        ? "border-emerald-300 shadow-md bg-emerald-50/50"
        : "border-slate-200 hover:border-emerald-200 shadow-sm";
      bgChecked = isCompleted
        ? "bg-emerald-500 border-emerald-500"
        : "border-slate-300 hover:border-emerald-400";
      textChecked = isCompleted ? "text-emerald-900" : "text-slate-700";
      iconColor = isCompleted ? "text-emerald-200" : "text-emerald-400";
      ringColor = "text-emerald-500";
    } else if (habit.pillar === "mindfulness") {
      strokeColor = isCompleted
        ? "border-amber-300 shadow-md bg-amber-50/50"
        : "border-slate-200 hover:border-amber-200 shadow-sm";
      bgChecked = isCompleted
        ? "bg-amber-500 border-amber-500"
        : "border-slate-300 hover:border-amber-400";
      textChecked = isCompleted ? "text-amber-900" : "text-slate-700";
      iconColor = isCompleted ? "text-amber-200" : "text-amber-400";
      ringColor = "text-amber-500";
    }

    // SVG Ring Calculations
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = (getCurrentCount(habit) / habit.targetCount) * 100;
    const dashoffset = circumference - (progressPercent / 100) * circumference;

    return (
      <div
        key={habit.id}
        className={`liquid-glass p-3 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden select-none spatial-hover ${strokeColor}`}
      >
        {/* Click-to-Complete Interactive Ring */}
        <div
          className="relative w-10 h-10 shrink-0 flex items-center justify-center cursor-pointer group"
          onClick={() => handleHabitClick(habit.id)}
        >
          {/* Base Background Track */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="20"
              cy="20"
              r={radius}
              className="fill-none stroke-slate-200"
              strokeWidth="3"
            />
            {/* Progress Segment Fill */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              className={`fill-none ${ringColor} transition-all duration-300 ease-out`}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Icon or Count Indicator */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-transform group-active:scale-90`}
          >
            {isCompleted ? (
              <Check className={`w-4 h-4 ${iconColor}`} strokeWidth={4} />
            ) : (
              <span className={`text-[10px] font-black ${textChecked}`}>
                {getCurrentCount(habit)}/{habit.targetCount}
              </span>
            )}
          </div>
        </div>

        <div
          className="flex-1 cursor-pointer"
          onClick={() => setActiveDetailHabit(habit)}
        >
          <h3 className={`text-sm font-bold transition-colors ${textChecked}`}>
            {habit.title}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Flame
                className={`w-3 h-3 ${habit.streak > 0 ? "text-orange-400" : "text-slate-300"}`}
              />
              {habit.streak} Hari Berturut
            </span>
            {habit.targetCount > 1 && !isCompleted && (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">
                Target: {habit.targetCount}x
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-full flex flex-col p-4 md:p-8 animate-fade-in pb-32">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          {/* Header Wrapped in Card */}
          <div className="animated-gradient-border liquid-glass p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 spatial-shadow">
            <div className="flex items-center gap-5 text-center md:text-left z-10 relative">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center border-2 border-indigo-200 shadow-inner">
                <Sun className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                  Habit Tracker
                </h1>
                <p className="text-slate-500 font-medium text-sm mt-1">
                  Bangun kebiasaan baik setiap harinya.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 md:py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" /> Habit Baru
            </button>
          </div>

          {/* Main Content Split: Settings Left vs Calendar Sidebar Right */}
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Left Column: Habits List & Recommendations */}
            <div className="w-full xl:w-2/3 flex flex-col gap-8">
              {/* Unified Routine List Container */}
              <div className="liquid-glass border border-orange-100/50 rounded-3xl p-6 spatial-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-orange-700">
                    <Sun className="w-5 h-5" /> Rutinitas Harian
                  </h3>
                  <span className="text-xs font-bold bg-white text-orange-600 px-3 py-1 rounded-full shadow-sm border border-orange-100">
                    Total: {habits.length}
                  </span>
                </div>

                {habits.length === 0 ? (
                  <div className="text-center py-8 px-4 flex flex-col items-center gap-4">
                    {/* Student journaling SVG illustration */}
                    <div className="animate-float" style={{ animationDuration: '4s' }}>
                      <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-auto mx-auto">
                        {/* Notebook/Journal */}
                        <rect x="40" y="40" width="110" height="130" rx="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                        <rect x="40" y="40" width="18" height="130" rx="10" fill="#F59E0B" opacity="0.8" />
                        {/* Spiral binding */}
                        {[60, 80, 100, 120, 140].map(y => (
                          <circle key={y} cx="49" cy={y} r="4" fill="white" stroke="#D97706" strokeWidth="1.5" />
                        ))}
                        {/* Lines on journal */}
                        <line x1="68" y1="70" x2="138" y2="70" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
                        <line x1="68" y1="85" x2="138" y2="85" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
                        <line x1="68" y1="100" x2="118" y2="100" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
                        <line x1="68" y1="115" x2="128" y2="115" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
                        {/* Checkmarks — drawn habits */}
                        <path d="M68 71 L72 75 L80 65" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M68 86 L72 90 L80 80" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Small star decoration on journal */}
                        <path d="M130 55 L131.5 60 L136 61.5 L131.5 63 L130 68 L128.5 63 L124 61.5 L128.5 60 Z" fill="#F59E0B" />
                        {/* Student boy */}
                        {/* Head */}
                        <circle cx="155" cy="80" r="20" fill="#FBBF24" />
                        <path d="M137 72 Q142 56 155 60 Q168 56 173 72" fill="#1E293B" />
                        {/* Eyes */}
                        <circle cx="149" cy="80" r="4" fill="white" />
                        <circle cx="161" cy="80" r="4" fill="white" />
                        <circle cx="149.5" cy="80.5" r="2" fill="#1E293B" />
                        <circle cx="161.5" cy="80.5" r="2" fill="#1E293B" />
                        <circle cx="150" cy="79.5" r="0.7" fill="white" />
                        <circle cx="162" cy="79.5" r="0.7" fill="white" />
                        {/* Smile */}
                        <path d="M149 88 Q155 94 161 88" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
                        {/* Body */}
                        <rect x="138" y="98" width="34" height="45" rx="12" fill="#4F46E5" />
                        {/* Arm holding pen */}
                        <path d="M138 115 Q110 125 95 135" stroke="#FBBF24" strokeWidth="10" strokeLinecap="round" />
                        {/* Pen */}
                        <rect x="78" y="128" width="28" height="7" rx="3" fill="#EF4444" transform="rotate(-35 78 128)" />
                        <polygon points="70,148 73,140 79,145" fill="#1E293B" transform="rotate(-35 70 148)" />
                        {/* Decorative sparkles */}
                        <path d="M20 50 L21 54 L25 55 L21 56 L20 60 L19 56 L15 55 L19 54 Z" fill="#A78BFA" opacity="0.8" />
                        <path d="M175 130 L176 133 L179 134 L176 135 L175 138 L174 135 L171 134 L174 133 Z" fill="#F472B6" opacity="0.8" />
                        <circle cx="25" cy="130" r="3" fill="#4F46E5" opacity="0.3" />
                        <circle cx="180" cy="60" r="4" fill="#FCD34D" opacity="0.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg mb-1">Mulai Kebiasaan Pertamamu! 🌟</h3>
                      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                        Belum ada rutinitas harianmu. Tambahkan habit baru atau pilih dari daftar paket rutinitas di bawah.
                      </p>
                    </div>
                    <button onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold btn-magnetic spatial-hover shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] z-10 group relative">
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Plus className="w-4 h-4 relative z-10" /> <span className="relative z-10">Tambah Habit Pertama</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    {habits.map(renderHabitItem)}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Calendar & Stats Sidebar */}
            <div className="w-full xl:w-1/3 flex flex-col gap-6 items-center xl:items-end">
              {/* Tear-off Calendar Widget (Scaled Down) */}
              <div className="relative z-10 w-full flex flex-col items-center xl:items-end animate-fade-in">
                <div className="bg-white rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.1)] overflow-hidden w-full max-w-[260px] aspect-[4/5] flex flex-col relative transform transition-transform hover:scale-105 duration-500">
                  {/* Calendar Binder Rings */}
                  <div className="absolute top-3 left-1/4 w-2.5 h-6 bg-zinc-800 rounded-full shadow-inner z-20"></div>
                  <div className="absolute top-3 right-1/4 w-2.5 h-6 bg-zinc-800 rounded-full shadow-inner z-20"></div>

                  {/* Red Header (Month/Year) */}
                  <div className="bg-red-600 pt-8 pb-4 px-5 flex flex-col items-center justify-center relative border-b-[3px] border-red-700">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                    <div className="w-full flex justify-between items-center z-10">
                      <h2 className="text-xl font-black text-white tracking-widest uppercase shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                        {new Date(activeDate).toLocaleDateString("id-ID", {
                          month: "long",
                        })}
                      </h2>
                    </div>
                    <div className="w-full flex justify-between mt-1.5 z-10">
                      <span className="text-red-100 font-black text-xs">
                        {new Date(activeDate).getFullYear()}
                      </span>
                      <span className="text-white font-bold text-xs uppercase tracking-wider">
                        {new Date(activeDate).toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Date Body */}
                  <div className="bg-[#f8f9fa] flex-1 flex flex-col items-center justify-center relative inner-shadow-sm">
                    {/* Faint Grid Texture */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                    <h1 className="text-[80px] leading-none font-black text-zinc-900 tracking-tighter drop-shadow-md">
                      {new Date(activeDate).getDate()}
                    </h1>
                  </div>

                  {/* Calendar Controls */}
                  <div className="absolute bottom-0 w-full bg-white/50 backdrop-blur-md p-3 flex justify-between items-center border-t border-slate-200">
                    <button
                      onClick={() => handleDateChange(-1)}
                      className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full shadow-md transition-all active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeDate === formatDateStr(new Date())
                        ? "Hari Ini"
                        : "Riwayat"}
                    </span>
                    <button
                      onClick={() => handleDateChange(1)}
                      className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={activeDate === formatDateStr(new Date())}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Synergy Status Insights (Sidebar format instead of floating) */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col gap-4 shadow-sm w-full max-w-[260px]">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl border ${balanceState === "buffed" ? "bg-emerald-50 text-emerald-500 border-emerald-100" : balanceState === "debuffed" ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-blue-50 text-blue-500 border-blue-100"}`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                      Status Keselarasan
                    </p>
                    <p
                      className={`font-black text-sm flex items-center gap-1 ${balanceState === "buffed" ? "text-emerald-600" : balanceState === "debuffed" ? "text-rose-600" : "text-slate-700"}`}
                    >
                      {balanceState === "buffed" && "ASCENDED STRIKE!"}
                      {balanceState === "balanced" && "STABIL"}
                      {balanceState === "debuffed" && "BURNOUT WARNING"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                    Efek Besok <Info className="w-3 h-3" />
                  </p>
                  {balanceState === "buffed" && (
                    <p className="font-bold text-xs text-emerald-600">
                      +3 Extra Koin Energi
                    </p>
                  )}
                  {balanceState === "balanced" && (
                    <p className="font-bold text-xs text-slate-500">
                      Batas Normal (10 Koin)
                    </p>
                  )}
                  {balanceState === "debuffed" && (
                    <p className="font-bold text-xs text-rose-600">
                      -3 Penalti Energi
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Habit Recommendations - Full Width */}
          <div className="mb-[200px]">
            <h3 className="font-bold text-sm mb-4 text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Paket Rutinitas Populer
            </h3>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
              {POPULAR_ROUTINES.map((routine) => {
                const borderHoverColor =
                  routine.pillar === "cognitive"
                    ? "hover:border-blue-300"
                    : routine.pillar === "vitality"
                      ? "hover:border-emerald-300"
                      : "hover:border-amber-300";

                const textPillarColor =
                  routine.pillar === "cognitive"
                    ? "text-blue-500"
                    : routine.pillar === "vitality"
                      ? "text-emerald-500"
                      : "text-amber-500";

                const labelPillarColor =
                  routine.pillar === "cognitive"
                    ? "bg-blue-50 border-blue-100"
                    : routine.pillar === "vitality"
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-amber-50 border-amber-100";

                return (
                  <div
                    key={routine.id}
                    className={`shrink-0 w-64 border border-slate-200/50 liquid-glass rounded-2xl p-5 snap-center spatial-hover transition-all ${borderHoverColor}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-inner">
                        {routine.icon}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${labelPillarColor} ${textPillarColor}`}
                      >
                        {routine.pillar} ({routine.target}x)
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">
                      {routine.title}
                    </h4>
                    <p className="text-xs text-slate-500 mb-4 h-8 line-clamp-2">
                      {routine.desc}
                    </p>
                    <button
                      onClick={() => handleApplyRoutine(routine)}
                      className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-xl btn-magnetic spatial-hover transition-colors shadow-[0_4px_10px_-2px_rgba(30,41,59,0.4)] flex items-center justify-center gap-2 relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Plus className="w-3 h-3 relative z-10" /> <span className="relative z-10">Terapkan Habit</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      {/* Celebration Toast Modal */}
      {
        showCelebration && createPortal(
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white px-8 py-4 rounded-2xl shadow-[0_10px_40px_rgba(34,197,94,0.3)] border border-emerald-100 flex items-center gap-4 z-50 animate-bounce">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-lg">
                Habit Terlaksana!
              </h4>
              <p className="text-sm font-medium text-emerald-600">
                Synergy point bertambah.
              </p>
            </div>
          </div>
          , document.body)}

      {/* Undo Habit Confirmation Modal */}
      {
        confirmUndoId && createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up border border-slate-200 text-center p-8">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <X className="w-10 h-10 text-rose-500" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                Batalkan Checklist Habit?
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Tandai habit "
                {habits.find((h) => h.id === confirmUndoId)?.title}" sebagai
                belum selesai untuk hari ini.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={cancelUndo}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors w-full"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeUndo}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md hover:shadow-lg transition-all w-full"
                >
                  Ulang & Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Add Habit Modal */}
      {
        showAddModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in px-4 pb-0 sm:pb-4">
            {/* Neko peeks from bottom with speech bubble */}
            <div className="hidden sm:flex absolute bottom-0 left-[calc(50%-240px)] translate-x-[-100%] items-end gap-3 pb-2">
              <NekoMascotFull className="w-28 h-auto" animate={false} />
              <div className="relative mb-12 bg-white border border-orange-100 shadow-xl rounded-2xl rounded-bl-none px-4 py-2.5">
                <div className="absolute -bottom-3 left-4 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white" />
                <p className="text-sm font-bold text-orange-600 whitespace-nowrap">Rutinitas baru? Seru! Nyaa~ 🐾</p>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up border border-white spatial-shadow relative overflow-hidden">
              {/* Mobile mascot top bar */}
              <div className="flex items-center gap-3 sm:hidden mb-4 pb-3 border-b border-orange-50">
                <NekoMascotMini className="w-10 h-10" />
                <p className="text-xs font-bold text-orange-500 italic">"Wah, kebiasaan baru! Semangat ya meong!"</p>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> Buat Kebiasaan Baru
              </h3>
              <form onSubmit={handleAddHabit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Nama Kebiasaan
                    </label>
                    <input
                      type="text"
                      required
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                      placeholder="Contoh: Baca Jurnal 10 Menit"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Pilih Ikon Bebas (Emoji)
                    </label>
                    <input
                      type="text"
                      maxLength="2"
                      value={newHabitIcon}
                      onChange={(e) => setNewHabitIcon(e.target.value)}
                      className="w-20 text-center text-2xl bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Target Frekuensi (Kali/Hari)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={newHabitTarget}
                      onChange={(e) => setNewHabitTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Pillar Keseimbangan
                    </label>
                    <select
                      value={newHabitPillar}
                      onChange={(e) => setNewHabitPillar(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-bold"
                    >
                      <option value="cognitive">
                        Kognitif (Belajar/Skill)
                      </option>
                      <option value="vitality">
                        Vitalitas (Fisik/Tidur/Olahraga)
                      </option>
                      <option value="mindfulness">
                        Mindfulness (Mental/Spiritual)
                      </option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Complete Habit Confirmation Modal */}
      {
        confirmCompleteId && createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up border border-slate-200 text-center p-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <Check className="w-10 h-10 text-emerald-500" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                Selesaikan Habit ini?
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Tandai habit "
                {habits.find((h) => h.id === confirmCompleteId)?.title}" telah
                dilakukan untuk hari ini.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={cancelCompletion}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors w-full"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeCompletion}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md hover:shadow-lg transition-all w-full"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Detail Stats & Notes Modal */}
      {
        activeDetailHabit && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setActiveDetailHabit(null)}
            ></div>

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-slate-200">
              {/* Header Area */}
              <div
                className={`p-6 pb-8 text-white ${activeDetailHabit.pillar === "cognitive" ? "bg-blue-600" : activeDetailHabit.pillar === "vitality" ? "bg-emerald-500" : "bg-amber-500"}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner backdrop-blur-sm">
                      {activeDetailHabit.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-black drop-shadow-sm">
                        {activeDetailHabit.title}
                      </h2>
                      <p className="text-white/80 text-xs font-bold uppercase tracking-wider mt-0.5">
                        Pilar: {activeDetailHabit.pillar}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveDetailHabit(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-black/10 rounded-2xl p-3 flex items-center gap-3">
                    <Flame className="w-8 h-8 text-white opacity-80" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-white/70">
                        Streak Saat Ini
                      </p>
                      <p className="text-xl font-black">
                        {activeDetailHabit.streak}{" "}
                        <span className="text-sm font-medium opacity-80">
                          Hari
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-black/10 rounded-2xl p-3 flex items-center gap-3">
                    <Target className="w-8 h-8 text-white opacity-80" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-white/70">
                        Target Harian
                      </p>
                      <p className="text-xl font-black">
                        {getCurrentCount(activeDetailHabit)}
                        <span className="text-sm font-medium opacity-80">
                          /{activeDetailHabit.targetCount}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="p-6 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Feather className="w-4 h-4 text-slate-400" /> Jurnal &
                  Catatan (Opsional)
                </h3>
                <textarea
                  value={habitNotes[activeDetailHabit.id] || ""}
                  onChange={(e) =>
                    setHabitNotes({
                      ...habitNotes,
                      [activeDetailHabit.id]: e.target.value,
                    })
                  }
                  placeholder="Ada insight, mood, atau refleksi menarik saat melakukan habit ini hari ini? Catat di sini biar ngga lupa..."
                  className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
                />
                <p className="text-[10px] text-slate-400 font-medium text-right mt-2">
                  *Catatan ini tersimpan lokal (Private)
                </p>
              </div>
            </div>
          </div>
          , document.body)}
    </>
  );
};

export default Habits;
