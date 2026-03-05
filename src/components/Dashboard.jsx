import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Activity, LayoutGrid, Sparkles, TrendingUp, FileText, Flame, Zap, CheckCircle2,
  Target, Brain, Clock, BookOpen, Focus, Star, AlertTriangle, ChevronRight,
  Trophy, Calendar, Moon, Sun, Sunset, Sunrise, RefreshCw
} from 'lucide-react';
import { generateExecutiveReport } from '../utils/ReportGenerator';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ========= Helpers =========
const RocketIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="20" cy="20" r="2" fill="white" opacity="0.6" />
    <circle cx="160" cy="15" r="1.5" fill="white" opacity="0.5" />
    <circle cx="180" cy="40" r="2" fill="white" opacity="0.7" />
    <circle cx="40" cy="50" r="1" fill="white" opacity="0.4" />
    <circle cx="140" cy="60" r="1.5" fill="white" opacity="0.5" />
    <ellipse cx="100" cy="70" rx="24" ry="48" fill="white" opacity="0.95" />
    <ellipse cx="100" cy="50" rx="18" ry="32" fill="#EEF2FF" />
    <circle cx="100" cy="60" r="12" fill="white" stroke="#4F46E5" strokeWidth="3" />
    <circle cx="100" cy="60" r="7" fill="#4F46E5" />
    <circle cx="97" cy="57" r="2.5" fill="white" opacity="0.5" />
    <path d="M100 22 Q90 35 100 40 Q110 35 100 22Z" fill="#4F46E5" />
    <path d="M76 100 Q64 115 68 118 Q76 110 80 105Z" fill="#818CF8" />
    <path d="M124 100 Q136 115 132 118 Q124 110 120 105Z" fill="#818CF8" />
    <ellipse cx="100" cy="122" rx="14" ry="8" fill="#F59E0B" opacity="0.9" />
    <ellipse cx="100" cy="128" rx="10" ry="12" fill="#EF4444" opacity="0.7" />
    <ellipse cx="100" cy="134" rx="6" ry="10" fill="#FCD34D" opacity="0.6" />
    <path d="M55 30 L56.5 35 L61.5 36.5 L56.5 38 L55 43 L53.5 38 L48.5 36.5 L53.5 35 Z" fill="#FCD34D" opacity="0.8" />
    <path d="M155 75 L156 79 L160 80 L156 81 L155 85 L154 81 L150 80 L154 79 Z" fill="#A78BFA" opacity="0.7" />
  </svg>
);

// Impact Score computation
const computeImpactScore = (habits, focusSessions, completedTasks, loginStreak, radarScores) => {
  const habitScore = Math.min((habits.doneToday / Math.max(habits.total, 1)) * 100, 100);
  const focusScore = Math.min(focusSessions * 12, 100);
  const taskScore = Math.min(completedTasks * 8, 100);
  const streakScore = Math.min(loginStreak * 10, 100);
  const radarAvg = Object.values(radarScores).reduce((a, b) => a + b, 0) / Object.keys(radarScores).length;

  const weighted = (habitScore * 0.25) + (focusScore * 0.25) + (taskScore * 0.20) + (streakScore * 0.15) + (radarAvg * 0.15);
  return Math.round(weighted);
};

const getImpactLabel = (score) => {
  if (score >= 85) return { label: 'Luar Biasa 🏆', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 70) return { label: 'Sangat Produktif ⭐', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
  if (score >= 50) return { label: 'Berkembang 📈', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { label: 'Perlu Dorongan 💪', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
};

const generateDynamicInsight = (habits, focusSessions, deadlineCount, radarScores, completedTasks) => {
  const weakest = Object.entries(radarScores).sort((a, b) => a[1] - b[1])[0];
  const insights = [];

  if (habits.doneToday === habits.total && habits.total > 0)
    insights.push({ icon: '🎉', text: `Semua ${habits.total} habit hari ini sudah selesai! Kamu luar biasa.`, color: 'text-emerald-700' });
  else if (habits.doneToday === 0 && habits.total > 0)
    insights.push({ icon: '⏰', text: `Belum ada habit hari ini yang dikerjakan. Mulai dari yang termudah dulu!`, color: 'text-amber-700' });

  if (focusSessions >= 3)
    insights.push({ icon: '🧠', text: `${focusSessions} sesi fokus hari ini. Flow state tercapai!`, color: 'text-indigo-700' });
  else if (focusSessions === 0)
    insights.push({ icon: '🌿', text: 'Coba satu sesi Deep Focus 25 menit untuk mulai produktif hari ini.', color: 'text-purple-700' });

  if (deadlineCount > 3)
    insights.push({ icon: '🚨', text: `${deadlineCount} deadline aktif! Prioritaskan menggunakan Eisenhower Matrix.`, color: 'text-rose-700' });

  if (weakest && weakest[1] < 40) {
    const labels = { akademik: 'Akademik', organisasi: 'Organisasi', istirahat: 'Istirahat', sosial: 'Sosial', tugas: 'Penyelesaian Tugas' };
    insights.push({ icon: '💡', text: `Area "${labels[weakest[0]] || weakest[0]}" butuh perhatian lebih minggu ini.`, color: 'text-slate-700' });
  }

  if (insights.length === 0)
    insights.push({ icon: '✨', text: 'Semua indikator hijau! Pertahankan momentum ini!', color: 'text-emerald-700' });

  return insights[0];
};

// ========= MAIN COMPONENT =========
const Dashboard = () => {
  // ---- States ----
  const [loginStreak, setLoginStreak] = useState(0);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [energyCoins, setEnergyCoins] = useState(10);
  const [activeDeadlineCount, setActiveDeadlineCount] = useState(0);
  const [habitsData, setHabitsData] = useState({ total: 0, doneToday: 0, weekCompletion: [] });
  const [focusSessionsToday, setFocusSessionsToday] = useState(0);
  const [impactScore, setImpactScore] = useState(0);
  const [dynamicInsight, setDynamicInsight] = useState(null);
  const [weeklyBarData, setWeeklyBarData] = useState([]);

  // Evaluation
  const [evaluationState, setEvaluationState] = useState('idle');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('stuprod_radar_scores');
    return saved ? JSON.parse(saved) : { akademik: 50, organisasi: 50, istirahat: 50, sosial: 50, tugas: 50 };
  });
  const [insightText, setInsightText] = useState('');
  const [finalInsight, setFinalInsight] = useState('');

  // Heatmap
  const [heatmap, setHeatmap] = useState(() => Array.from({ length: 48 }, (_, i) => ({
    id: i, date: new Date(new Date().setDate(new Date().getDate() - (47 - i))).toISOString().split('T')[0], active: false, intensity: 0, count: 0
  })));

  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState('🌤');
  const [GreetingIconComp, setGreetingIconComp] = useState(() => Sun);
  const userName = JSON.parse(localStorage.getItem('stuprod_user') || '{}')?.name || 'Mahasiswa';

  // ---- Load All Module Data ----
  const loadAllData = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Login Streak
    const streakData = JSON.parse(localStorage.getItem('stuprod_login_streak') || '{"lastLogin":"","streak":0}');
    setLoginStreak(streakData.streak);
    if (streakData.lastLogin !== today) setShowCheckInModal(true);

    // 2. Tasks (deadline + matrix)
    const deadlineTasks = JSON.parse(localStorage.getItem('stuprod_tasks') || '[]');
    const matrixTasks = JSON.parse(localStorage.getItem('matrix_tasks') || '[]');
    const timeBlocks = JSON.parse(localStorage.getItem('time_blocks') || '{}');

    const completedCount = deadlineTasks.filter(t => t.completed).length + matrixTasks.filter(t => t.completed).length;
    setCompletedTaskCount(completedCount);

    const activeDeadlines = deadlineTasks.filter(t => !t.completed && new Date(t.deadline) > new Date()).length;
    setActiveDeadlineCount(activeDeadlines);

    // 3. Energy / Synergy
    const synergy = localStorage.getItem('stuprod_balance_state') || 'balanced';
    setEnergyCoins(synergy === 'buffed' ? 13 : synergy === 'debuffed' ? 7 : 10);

    // 4. Habits
    const allHabits = JSON.parse(localStorage.getItem('stuprod_habits') || '[]');
    const todayHabits = allHabits.filter(h => !h.archived);
    const doneTodayHabits = todayHabits.filter(h => h.lastCompleted === today).length;
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const done = allHabits.filter(h => h.lastCompleted === ds).length;
      return { day: d.toLocaleDateString('id-ID', { weekday: 'short' }), done, total: todayHabits.length };
    });
    setHabitsData({ total: todayHabits.length, doneToday: doneTodayHabits, weekCompletion: last7 });

    // 5. Deep Focus sessions today
    const forestStats = JSON.parse(localStorage.getItem('forest_stats') || '{"planted":0,"dead":0}');
    const todayFocusKey = `forest_today_${today}`;
    const todaySessions = parseInt(localStorage.getItem(todayFocusKey) || '0');
    setFocusSessionsToday(Math.min(todaySessions, forestStats.planted));

    // 6. Weekly bar (tasks per day)
    const weekBar = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const blocksCount = (timeBlocks[ds] || []).length;
      const deadlinesOnDay = deadlineTasks.filter(t => t.createdAt?.startsWith(ds) && t.completed).length;
      return { day: d.toLocaleDateString('id-ID', { weekday: 'short' }), value: blocksCount + deadlinesOnDay };
    });
    setWeeklyBarData(weekBar);

    // 7. Heatmap
    const completedDates = [];
    deadlineTasks.forEach(t => { if (t.completed && t.createdAt) completedDates.push(t.createdAt.split('T')[0]); });
    matrixTasks.forEach(t => { if (t.completed) completedDates.push(t.completedAt?.split('T')[0] || today); });
    Object.keys(timeBlocks).forEach(date => timeBlocks[date].forEach(b => { if (b.completed) completedDates.push(date); }));
    const dateCounts = completedDates.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {});
    const todayDate = new Date();
    setHeatmap(Array.from({ length: 48 }, (_, i) => {
      const d = new Date(todayDate); d.setDate(todayDate.getDate() - (47 - i));
      const ds = d.toISOString().split('T')[0];
      const count = dateCounts[ds] || 0;
      return { id: i, date: ds, count, active: count > 0, intensity: count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3 };
    }));

    // 8. Radar scores
    const savedScores = JSON.parse(localStorage.getItem('stuprod_radar_scores') || '{"akademik":50,"organisasi":50,"istirahat":50,"sosial":50,"tugas":50}');
    setScores(savedScores);

    // 9. Impact Score + Insight
    const is = computeImpactScore(
      { doneToday: doneTodayHabits, total: todayHabits.length },
      todaySessions, completedCount, streakData.streak, savedScores
    );
    setImpactScore(is);
    setDynamicInsight(generateDynamicInsight(
      { doneToday: doneTodayHabits, total: todayHabits.length },
      todaySessions, activeDeadlines, savedScores, completedCount
    ));
  }, []);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 6) { setGreeting('Selamat Dini Hari'); setGreetingIcon('🌙'); setGreetingIconComp(() => Moon); }
    else if (h < 12) { setGreeting('Selamat Pagi'); setGreetingIcon('🌤'); setGreetingIconComp(() => Sunrise); }
    else if (h < 15) { setGreeting('Selamat Siang'); setGreetingIcon('☀️'); setGreetingIconComp(() => Sun); }
    else if (h < 19) { setGreeting('Selamat Sore'); setGreetingIcon('🌅'); setGreetingIconComp(() => Sunset); }
    else { setGreeting('Selamat Malam'); setGreetingIcon('🌙'); setGreetingIconComp(() => Moon); }

    loadAllData();
  }, [loadAllData]);

  // ---- Evaluation Logic ----
  const evaluationQuestions = [
    {
      type: 'choice', text: 'Meow! 🐾 Gimana kualitas tidurmu seminggu ini?', options: [
        { text: 'Nyenyak 7-8 jam, bangun segar! 🌅', effect: { istirahat: 30, akademik: 10 } },
        { text: 'Cukup tapi sering kebangun 🥱', effect: { istirahat: 0 } },
        { text: 'Begadang ngerjain tugas 🦉', effect: { istirahat: -25, tugas: 15 } },
        { text: 'Begadang scroll/main game 🎮', effect: { istirahat: -30, sosial: 10 } }
      ]
    },
    {
      type: 'choice', text: 'Gimana fokus studi dan belajarmu belakangan ini?', options: [
        { text: 'Sangat fokus, catatan rapi! 🤓', effect: { akademik: 30, tugas: 10 } },
        { text: 'Biasa, kadang ngelamun 😅', effect: { akademik: 0 } },
        { text: 'Keteteran, banyak skip 🤯', effect: { akademik: -25 } }
      ]
    },
    {
      type: 'choice', text: 'Bagaimana strategi menyelesaikan tugasmu minggu ini?', options: [
        { text: 'Dicicil, selesai sebelum deadline 😎', effect: { tugas: 30, istirahat: 10 } },
        { text: 'On track, masih proses 🏃', effect: { tugas: 10 } },
        { text: 'SKS! Kebut semalam 😱', effect: { tugas: -20, istirahat: -15, akademik: -10 } },
        { text: 'Ada yang telat/kelewat 😭', effect: { tugas: -35 } }
      ]
    },
    {
      type: 'choice', text: 'Seberapa aktif di organisasi/BEM/UKM minggu ini?', options: [
        { text: 'Super sibuk, rapat mulu 🔥', effect: { organisasi: 30, istirahat: -15 } },
        { text: 'Ada event, masih balance ⚖️', effect: { organisasi: 15 } },
        { text: 'Lagi santai 🏖️', effect: { organisasi: -5 } },
        { text: 'Fokus kuliah aja 📚', effect: { organisasi: 0, akademik: 10 } }
      ]
    },
    {
      type: 'choice', text: 'Me-time dan sosial sama teman-teman gimana?', options: [
        { text: 'Sering nongkrong, seru! 🎉', effect: { sosial: 30, tugas: -10 } },
        { text: 'Ada me-time pas weekend ☕', effect: { sosial: 15, istirahat: 10 } },
        { text: 'Sama sekali nggak sempat 😿', effect: { sosial: -25, istirahat: -10 } }
      ]
    },
    {
      type: 'choice', text: 'Secara mental, seberapa berat perjalananmu seminggu ini?', options: [
        { text: "I'm good and productive! ✨", effect: { istirahat: 10, akademik: 10, tugas: 10 } },
        { text: 'Agak capek, tapi oke 💪', effect: { istirahat: -5 } },
        { text: 'Sangat stress & overwhelmed 🌧️', effect: { istirahat: -30, sosial: -15, akademik: -20 } }
      ]
    },
    { type: 'essay', text: 'Tulis insight atau evaluasi singkatmu tentang minggu ini (Opsional 😺)' }
  ];

  const handleAnswer = (effect) => {
    if (effect) {
      setScores(prev => {
        const newScores = { ...prev };
        for (const key in effect) newScores[key] = Math.max(0, Math.min(100, newScores[key] + effect[key]));
        localStorage.setItem('stuprod_radar_scores', JSON.stringify(newScores));
        window.dispatchEvent(new Event('radarScoreUpdated'));
        return newScores;
      });
    }
    if (currentQuestion < evaluationQuestions.length - 1) setCurrentQuestion(prev => prev + 1);
    else { setFinalInsight(insightText); setEvaluationState('result'); }
  };

  const startEvaluation = () => {
    setEvaluationState('evaluating'); setCurrentQuestion(0);
    const init = { akademik: 50, organisasi: 50, istirahat: 50, sosial: 50, tugas: 50 };
    setScores(init); localStorage.setItem('stuprod_radar_scores', JSON.stringify(init));
    window.dispatchEvent(new Event('radarScoreUpdated'));
    setInsightText(''); setFinalInsight('');
  };

  const getRecommendation = () => {
    const min = Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);
    if (Object.values(scores).every(v => v >= 70)) return '🌟 Luar biasa! Semua aspek hidupmu seimbang sempurna minggu ini. 🥇';
    const advice = { istirahat: '⚠️ Istirahatmu kurang. Tidur 7-8 jam itu investasi produktivitas! 😴', akademik: '⚠️ Fokus belajarmu menurun. Coba review catatan sebelum kelas. 📚', sosial: '⚠️ Terlalu sibuk sendirian! Manusia butuh koneksi sosial. 🎮', organisasi: '⚠️ Soft skill lewat organisasi penting untuk karir. Aktif lagi! 🤝', tugas: '⚠️ Tugas mulai menumpuk! Cicil dengan Pomodoro timer sekarang. ⏰' };
    return advice[min] || '✨ Pertahankan keseimbanganmu!';
  };

  const handleCheckIn = () => {
    const today = new Date().toISOString().split('T')[0];
    const streakData = JSON.parse(localStorage.getItem('stuprod_login_streak') || '{"lastLogin":"","streak":0}');
    let newStreak = streakData.streak;
    if (streakData.lastLogin) {
      const diff = Math.ceil(Math.abs(new Date(today) - new Date(streakData.lastLogin)) / (1000 * 60 * 60 * 24));
      newStreak = diff === 1 ? newStreak + 1 : diff > 1 ? 1 : newStreak;
    } else newStreak = 1;
    setLoginStreak(newStreak);
    localStorage.setItem('stuprod_login_streak', JSON.stringify({ lastLogin: today, streak: newStreak }));
    setShowCheckInModal(false);
    loadAllData();
  };

  const getHeatmapColor = (intensity) => ['bg-slate-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'][intensity] || 'bg-slate-100';

  const impactMeta = getImpactLabel(impactScore);

  const radarData = {
    labels: ['Akademik', 'Organisasi', 'Istirahat', 'Sosial', 'Tugas'],
    datasets: [{ label: 'Keseimbangan', data: [scores.akademik, scores.organisasi, scores.istirahat, scores.sosial, scores.tugas], backgroundColor: 'rgba(79,70,229,0.15)', borderColor: 'rgba(79,70,229,1)', borderWidth: 2, pointBackgroundColor: 'rgba(79,70,229,1)', pointRadius: 4 }]
  };
  const radarOptions = { scales: { r: { suggestedMin: 0, suggestedMax: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { display: false }, pointLabels: { font: { size: 10, weight: 'bold' }, color: '#64748b' } } }, plugins: { legend: { display: false } } };

  const barData = {
    labels: weeklyBarData.map(d => d.day),
    datasets: [{ label: 'Aktivitas', data: weeklyBarData.map(d => d.value), backgroundColor: weeklyBarData.map((_, i) => i === 6 ? 'rgba(79,70,229,0.9)' : 'rgba(79,70,229,0.3)'), borderRadius: 8, borderSkipped: false }]
  };
  const barOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw} aktivitas` } } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } }, y: { display: false, grid: { display: false } } } };

  // ---- RENDER ----
  return (
    <>
      <div id="dashboard-report-content" className="space-y-6 pb-32 animate-fade-in">

        {/* ===== WELCOME BANNER ===== */}
        <div className="relative overflow-hidden animated-gradient-bg rounded-3xl p-6 md:p-8 text-white spatial-shadow">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-4 w-fit">
                <span className="text-base">{greetingIcon}</span>
                <span className="text-xs font-bold text-white/90 uppercase tracking-widest">{greeting}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Halo, <span className="text-yellow-300">{userName.charAt(0).toUpperCase() + userName.slice(1)}</span>! 👋
              </h1>
              <p className="text-indigo-200 mt-2 text-sm font-medium max-w-md leading-relaxed">
                Pusat kendali produktivitasmu. Data real-time dari seluruh modul StuProd tersinkronisasi di sini.
              </p>

              {/* Quick Stats Row */}
              <div className="flex gap-3 mt-5 flex-wrap">
                {[
                  { icon: '🔥', label: 'Streak', value: `${loginStreak} Hari` },
                  { icon: '✅', label: 'Tugas Selesai', value: `${completedTaskCount}` },
                  { icon: '⚡', label: 'Koin Energi', value: `${energyCoins}` },
                  { icon: '⏰', label: 'Deadline Aktif', value: `${activeDeadlineCount}`, alert: activeDeadlineCount > 3 },
                ].map(stat => (
                  <div key={stat.label} className={`bg-white/15 backdrop-blur-sm border ${stat.alert ? 'border-rose-400/60 bg-rose-400/20' : 'border-white/20'} rounded-2xl px-4 py-2.5 text-center transition-all`}>
                    <div className="text-base">{stat.icon}</div>
                    <div className={`text-base font-black leading-tight ${stat.alert ? 'text-rose-200' : 'text-white'}`}>{stat.value}</div>
                    <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
                <button
                  data-html2canvas-ignore="true"
                  onClick={generateExecutiveReport}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 rounded-2xl px-4 py-2.5 text-center transition-all shadow-lg flex items-center justify-center gap-2 group"
                >
                  <FileText className="w-4 h-4 text-indigo-200 group-hover:text-white" />
                  <div className="text-left leading-tight">
                    <div className="text-xs font-black whitespace-nowrap">Export PDF</div>
                    <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wide">Laporan</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="hidden md:flex w-36 h-32 shrink-0 animate-float">
              <RocketIllustration />
            </div>
          </div>
        </div>

        {/* ===== INTELLIGENCE HUB ROW 1 ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Impact Score Card */}
          <div className="liquid-glass p-6 rounded-3xl spatial-shadow flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-violet-50/30 pointer-events-none" />
            <Trophy className="w-8 h-8 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Skor Dampak Minggu Ini</p>
              <div className="text-6xl font-black text-slate-800 leading-none">{impactScore}</div>
              <div className="text-sm text-slate-400 font-medium">/ 100</div>
            </div>
            <div className={`px-3 py-1.5 rounded-full border text-xs font-bold ${impactMeta.bg} ${impactMeta.color} ${impactMeta.border}`}>
              {impactMeta.label}
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700" style={{ width: `${impactScore}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-snug">Dihitung dari habit, fokus, tugas, streak, dan keseimbangan hidup</p>
          </div>

          {/* Dynamic Insight Card */}
          <div className="liquid-glass p-6 rounded-3xl spatial-shadow flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-amber-100 rounded-xl"><Sparkles className="w-4 h-4 text-amber-600" /></div>
              <h3 className="font-bold text-slate-700 text-sm">Insight Hari Ini</h3>
              <button onClick={loadAllData} className="ml-auto p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Refresh Data">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            {dynamicInsight && (
              <div className="bg-white/70 border border-slate-200/60 rounded-2xl p-4 flex-1">
                <span className="text-2xl block mb-2">{dynamicInsight.icon}</span>
                <p className={`text-sm font-semibold leading-relaxed ${dynamicInsight.color}`}>{dynamicInsight.text}</p>
              </div>
            )}

            {/* Hari ini ringkasan */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <Focus className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <div className="text-lg font-black text-purple-700">{focusSessionsToday}</div>
                <div className="text-[9px] font-bold text-purple-400 uppercase tracking-wide">Sesi Fokus</div>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 text-center">
                <Star className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                <div className="text-lg font-black text-rose-700">{habitsData.doneToday}/{habitsData.total}</div>
                <div className="text-[9px] font-bold text-rose-400 uppercase tracking-wide">Habit Selesai</div>
              </div>
            </div>
          </div>

          {/* Weekly Activity Bar Chart */}
          <div className="liquid-glass p-6 rounded-3xl spatial-shadow flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-emerald-100 rounded-xl"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
              <h3 className="font-bold text-slate-700 text-sm">Aktivitas 7 Hari</h3>
            </div>
            <div className="flex-1 min-h-[120px]">
              {weeklyBarData.length > 0 && <Bar data={barData} options={barOptions} />}
            </div>
            <div className="text-[10px] font-medium text-slate-400 text-center">Kolom hari ini ditampilkan lebih gelap</div>
          </div>
        </div>

        {/* ===== BENTO GRID: Radar + Heatmap ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Radar / Evaluation */}
          <div className="lg:col-span-1 liquid-glass p-6 rounded-3xl spatial-shadow flex flex-col items-center relative overflow-hidden min-h-[360px]">
            <div className="w-full flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-100 rounded-xl"><Activity className="w-4 h-4 text-indigo-600" /></div>
              <h3 className="font-bold text-slate-700 text-sm">Radar Keseimbangan</h3>
            </div>

            <div className="w-full flex-1 flex flex-col items-center justify-center z-10">
              {evaluationState === 'idle' && (
                <div className="flex flex-col items-center text-center animate-fade-in-up w-full">
                  <div className="text-5xl mb-3 animate-bounce">😸</div>
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-indigo-100 shadow-sm mb-4 w-full">
                    <p className="text-sm font-semibold text-slate-700">Mau tahu sejauh mana keseimbangan hidupmu minggu ini? Yuk ngobrol!</p>
                  </div>
                  <button data-html2canvas-ignore="true" onClick={startEvaluation}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/30 text-sm">
                    Mulai Evaluasi Mingguan
                  </button>
                </div>
              )}

              {evaluationState === 'evaluating' && (
                <div className="flex flex-col items-center w-full animate-fade-in-up">
                  <div className="text-4xl mb-2">🐱</div>
                  <div className="bg-white/60 rounded-2xl p-3 border border-indigo-100 mb-4 w-full text-center">
                    <p className="text-xs font-semibold text-slate-700 leading-snug">{evaluationQuestions[currentQuestion].text}</p>
                  </div>
                  <div className="w-full flex flex-col gap-2">
                    {evaluationQuestions[currentQuestion].type === 'choice' ? (
                      evaluationQuestions[currentQuestion].options.map((opt, idx) => (
                        <button key={idx} onClick={() => handleAnswer(opt.effect)}
                          className="w-full text-left bg-white/50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 text-[11px] font-semibold py-2 px-3 rounded-xl transition-colors">
                          {opt.text}
                        </button>
                      ))
                    ) : (
                      <div className="w-full flex flex-col gap-2">
                        <textarea value={insightText} onChange={(e) => setInsightText(e.target.value)} placeholder="Tulis curhatan/insight..." className="w-full bg-white/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 resize-none h-20 outline-none focus:ring-2 focus:ring-indigo-300" />
                        <button onClick={() => handleAnswer(null)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-md">Selesai & Lihat Hasil</button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 mt-3">{evaluationQuestions.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentQuestion ? 'bg-indigo-500 scale-125' : i < currentQuestion ? 'bg-indigo-200' : 'bg-slate-200'}`} />)}</div>
                </div>
              )}

              {evaluationState === 'result' && (
                <div className="flex flex-col items-center w-full animate-fade-in-up">
                  <div className="w-full max-w-[200px] aspect-square mx-auto">
                    <Radar data={radarData} options={radarOptions} />
                  </div>
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 w-full text-center">
                    <p className="text-[11px] font-semibold text-amber-700 leading-relaxed">{getRecommendation()}</p>
                  </div>
                  {finalInsight && (
                    <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-2xl p-3 w-full">
                      <p className="text-[9px] uppercase font-bold text-indigo-400 mb-0.5">📝 Catatanmu</p>
                      <p className="text-[11px] text-slate-600 italic">"{finalInsight}"</p>
                    </div>
                  )}
                  <button data-html2canvas-ignore="true" onClick={() => setEvaluationState('idle')} className="mt-3 text-xs font-bold text-indigo-500 hover:text-indigo-700">Evaluasi Ulang</button>
                </div>
              )}
            </div>
          </div>

          {/* Heatmap */}
          <div className="lg:col-span-2 liquid-glass p-6 rounded-3xl spatial-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="flex items-center gap-2 mb-5 relative z-10">
              <div className="p-2 bg-emerald-100 rounded-xl"><LayoutGrid className="w-4 h-4 text-emerald-600" /></div>
              <h3 className="font-bold text-slate-700 text-sm">Heatmap Aktivitas — 48 Hari Terakhir</h3>
            </div>
            <div className="grid grid-cols-12 gap-1.5 relative z-10">
              {heatmap.map((item, i) => (
                <div key={i} className={`w-full aspect-square rounded-md ${getHeatmapColor(item.intensity)} hover:ring-2 hover:ring-indigo-400 hover:scale-110 transition-all cursor-pointer`}
                  title={`${new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'medium' })}: ${item.count} aktivitas`} />
              ))}
            </div>

            <div className="flex items-center justify-between mt-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-600">Streak Aktif</p>
                    <p className="text-xl font-black text-orange-500 leading-tight">{loginStreak} Hari</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Total aktivitas 48 hari</p>
                <p className="text-2xl font-black text-slate-800">{heatmap.reduce((a, c) => a + c.count, 0)} <span className="text-sm font-medium text-slate-400">item</span></p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 relative z-10">
              <span className="text-[10px] text-slate-400 font-medium">Sedikit</span>
              {['bg-slate-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'].map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
              ))}
              <span className="text-[10px] text-slate-400 font-medium">Banyak</span>
            </div>
          </div>
        </div>

        {/* ===== MOTIVATIONAL QUOTE ===== */}
        <div className="animated-gradient-border liquid-glass rounded-3xl p-6 flex items-center gap-5 spatial-shadow">
          <div className="shrink-0 text-6xl font-black text-indigo-100 leading-none select-none">"</div>
          <div>
            <p className="text-slate-700 font-semibold italic text-base leading-relaxed">
              Disiplin adalah jembatan antara tujuan dan pencapaian. Setiap kebiasaan kecil yang kamu bangun hari ini adalah investasi terbesar untuk masa depanmu.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-0.5 bg-indigo-400 rounded-full" />
              <p className="text-indigo-500 font-bold text-sm">Jim Rohn — via StuProd</p>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
        </div>

      </div>

      {/* ===== DAILY CHECK-IN MODAL (Portal) ===== */}
      {showCheckInModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl spatial-shadow flex flex-col items-center text-center relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl" />
            <div className="text-6xl mb-4 relative z-10 animate-bounce">📅</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 relative z-10">Check-in Harian!</h2>
            <p className="text-slate-500 text-sm mb-6 relative z-10">
              Selamat datang kembali, <strong>{userName}</strong>! Klaim kehadiranmu untuk menjaga <strong>Streak Aktif</strong> 🔥
            </p>
            <button onClick={handleCheckIn} className="w-full relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)]">
              Klaim Kehadiran 🔥
            </button>
          </div>
        </div>
        , document.body)}
    </>
  );
};

export default Dashboard;