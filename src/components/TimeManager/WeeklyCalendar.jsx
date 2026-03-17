import React from 'react';
import { Calendar as CalendarIcon, Target, Inbox, Sun, Sparkles, AlertTriangle, X, Check, CheckCircle, Edit2, Clock, MapPin, BookOpen, MoreVertical, Bell } from 'lucide-react';
import { getJson, setJson, getLocalDateKey } from '../../utils/storage';
import { prodifyConfirm } from '../../utils/popup';

const CATEGORY_META = {
  academic: { label: "Akademik", icon: "📚" },
  organization: { label: "Organisasi", icon: "🤝" },
  committee: { label: "Kepanitiaan", icon: "🎟️" },
  work: { label: "Kerja", icon: "💼" },
  personal: { label: "Pribadi", icon: "🧘" },
  project: { label: "Project", icon: "🚀" },
};

const getTaskGradient = (quadrant) => {
  switch (quadrant) {
    case "urgent-important": return "bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-rose-500/30";
    case "not-urgent-important": return "bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-blue-500/30";
    case "urgent-not-important": return "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-orange-500/30";
    case "not-urgent-not-important": return "bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-500/30";
    default: return "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-emerald-500/30";
  }
};

const WeeklyCalendar = ({
  next7Days, currentDate, setCurrentDate, isSameDay, scheduledBlocks, getDayFormatted,
  todayBlocks, isBurnout, currentDailyEnergy, MAX_DAILY_ENERGY, synergyState, tasks,
  quadrants, removeBlock, dateStrKey, globalGoal, setGlobalGoal, isEditingGoal,
  setIsEditingGoal, academicSchedule = [], onAssignQuadrant, onClearBlocksForDate,
}) => {
  const timeGrid = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}`);
  const timelineScrollRef = React.useRef(null);
  const optionsWrapRef = React.useRef(null);
  const bellWrapRef = React.useRef(null);

  const [upcomingEvent, setUpcomingEvent] = React.useState(null);
  const [showOptions, setShowOptions] = React.useState(false);
  const [isTimelineFullscreen, setIsTimelineFullscreen] = React.useState(false);
  const [showReminders, setShowReminders] = React.useState(false);
  const [alertsEnabled, setAlertsEnabled] = React.useState(() => getJson('prodify_timeline_alerts_v1', false));
  const [showMapModal, setShowMapModal] = React.useState(false);
  const [taskToMap, setTaskToMap] = React.useState(null);
  const [selectedQuadrant, setSelectedQuadrant] = React.useState(quadrants[0]?.id || "urgent-important");

  const scrollToHour = React.useCallback((hourStr) => {
    if (!timelineScrollRef.current) return;
    const el = timelineScrollRef.current.querySelector(`[data-hour="${hourStr}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const jumpToNow = React.useCallback(() => {
    const now = new Date();
    const hourStr = `${now.getHours()}`.padStart(2, '0');
    scrollToHour(hourStr);
  }, [scrollToHour]);

  const jumpToUpcoming = React.useCallback(() => {
    if (!upcomingEvent) return;
    const t = upcomingEvent.isClass ? (upcomingEvent.startTime || "00:00") : (upcomingEvent.time || "00:00");
    const hourStr = `${(t.split(':')[0] || "00")}`.padStart(2, '0');
    const todayKey = getLocalDateKey(new Date());
    const viewingKey = getLocalDateKey(currentDate);
    if (todayKey !== viewingKey) {
      const now = new Date();
      setCurrentDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      setTimeout(() => scrollToHour(hourStr), 80);
      return;
    }
    scrollToHour(hourStr);
  }, [currentDate, scrollToHour, setCurrentDate, upcomingEvent]);

  const exportSelectedDay = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const dateKey = dateStrKey;
    const blocks = scheduledBlocks?.[dateKey] || [];
    const dayOfWeek = currentDate.getDay();
    const classes = (academicSchedule || []).filter((s) => Number(s.dayOfWeek) === Number(dayOfWeek));

    const payload = {
      app: "Prodify",
      type: "weekly_calendar_day_export",
      date: dateKey,
      exportedAt: new Date().toISOString(),
      blocks,
      classes,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prodify_schedule_${dateKey}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [academicSchedule, currentDate, dateStrKey, scheduledBlocks]);

  const requestEnableAlerts = React.useCallback(async () => {
    setAlertsEnabled(true);
    setJson('prodify_timeline_alerts_v1', true);
    if (typeof Notification === 'undefined' || !Notification.requestPermission) return;
    if (Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch { /* ignore */ }
    }
  }, []);

  const disableAlerts = React.useCallback(() => {
    setAlertsEnabled(false);
    setJson('prodify_timeline_alerts_v1', false);
  }, []);

  const openMapModal = (task) => {
    setTaskToMap(task);
    setSelectedQuadrant(quadrants[0]?.id || "urgent-important");
    setShowMapModal(true);
  };

  const confirmMap = () => {
    if (taskToMap && selectedQuadrant && onAssignQuadrant) {
      onAssignQuadrant(taskToMap.id, selectedQuadrant);
    }
    setShowMapModal(false);
    setTaskToMap(null);
  };

  React.useEffect(() => {
      const checkUpcoming = () => {
      const now = new Date();
      const dateKey = getLocalDateKey(now);
      const realTodayBlocks = scheduledBlocks[dateKey] || [];

      let nextEvent = null;
      let minDiff = Infinity;
      realTodayBlocks.forEach(block => {
        const [h, m] = (block.time || "00:00").split(':').map(Number);
        const eventTime = new Date(now);
        eventTime.setHours(h, m, 0, 0);
        const diffMins = (eventTime - now) / 60000;

        if (diffMins > 0 && diffMins <= 20) {
          if (diffMins < minDiff) { minDiff = diffMins; nextEvent = { ...block, isClass: false, diffMins }; }
        }
      });

      const currentDay = now.getDay() === 0 ? 0 : now.getDay();
      academicSchedule.forEach(acad => {
        if (Number(acad.dayOfWeek) === currentDay) {
          const [h, m] = (acad.startTime || "00:00").split(':').map(Number);
          const eventTime = new Date(now);
          eventTime.setHours(h, m, 0, 0);
          const diffMins = (eventTime - now) / 60000;
          if (diffMins > 0 && diffMins <= 20) {
            if (diffMins < minDiff) { minDiff = diffMins; nextEvent = { ...acad, title: acad.course, isClass: true, diffMins }; }
          }
        }
      });

      if (nextEvent) {
        setUpcomingEvent(nextEvent);
      } else {
        setUpcomingEvent(null);
      }
    };

    checkUpcoming();
    const intv = setInterval(checkUpcoming, 30000);
    return () => clearInterval(intv);
  }, [scheduledBlocks, academicSchedule]);

  React.useEffect(() => {
    if (!alertsEnabled || !upcomingEvent) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    if (Number(upcomingEvent.diffMins) > 10) return;

    const dateKey = getLocalDateKey(new Date());
    const t = upcomingEvent.isClass ? (upcomingEvent.startTime || "00:00") : (upcomingEvent.time || "00:00");
    const baseId = upcomingEvent.id || upcomingEvent.taskId || upcomingEvent.title || "event";
    const notifyKey = `${dateKey}|${upcomingEvent.isClass ? "class" : "task"}|${baseId}|${t}`;

    const lastKey = getJson('prodify_timeline_last_notified_v1', null);
    if (lastKey === notifyKey) return;

    try {
      new Notification("Prodify: Jadwal sebentar lagi", {
        body: `${upcomingEvent.title} dalam ${Math.ceil(Number(upcomingEvent.diffMins))} menit.`,
      });
      setJson('prodify_timeline_last_notified_v1', notifyKey);
    } catch { /* ignore */ }
  }, [alertsEnabled, upcomingEvent]);

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setShowOptions(false);
      setShowReminders(false);
      setIsTimelineFullscreen(false);
    };

    const onPointerDown = (e) => {
      const t = e.target;
      if (showOptions && optionsWrapRef.current && t && !optionsWrapRef.current.contains(t)) {
        setShowOptions(false);
      }
      if (showReminders && bellWrapRef.current && t && !bellWrapRef.current.contains(t)) {
        setShowReminders(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [showOptions, showReminders]);

  return (
    <div className="liquid-glass dark:bg-slate-900/60 dark:border-slate-700/50 rounded-[2.5rem] spatial-shadow overflow-hidden transition-colors flex flex-col">
      {isTimelineFullscreen && (
        <div
          className="fixed inset-0 z-[240] bg-slate-900/60 backdrop-blur-sm"
          onClick={() => { setIsTimelineFullscreen(false); setShowOptions(false); setShowReminders(false); }}
        />
      )}
      <div className="p-6 md:p-8 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md">
            <CalendarIcon className="w-5 h-5" />
          </div>
          Kalender Produktivitas
        </h2>

        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-2 sm:pb-0">
          {next7Days.map((day, idx) => {
            const isSelected = isSameDay(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dateKey = day.toISOString().split("T")[0];
            const blocksCount = (scheduledBlocks[dateKey] || []).length;
            return (
              <button
                key={idx}
                onClick={() => setCurrentDate(day)}
                className={`flex-1 min-w-[64px] max-w-[100px] flex flex-col items-center py-2.5 px-1 rounded-2xl transition-all cursor-pointer ${isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-105 z-10" : "bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"}`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-indigo-200" : ""}`}>
                  {day.toLocaleDateString("id-ID", { weekday: "short" })}
                </span>
                <span className="text-xl font-black my-0.5">{day.getDate()}</span>
                {blocksCount > 0 ? (
                  <div className="flex items-center gap-1 text-[9px] font-bold">
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-emerald-400" : "bg-indigo-500"}`}></div>
                    {blocksCount}
                  </div>
                ) : (
                  <span className={`text-[9px] font-bold ${isSelected ? "text-indigo-300" : "opacity-50"}`}>
                    {isToday ? "Hari Ini" : "Kosong"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-0 flex-1">

        <div
          className={isTimelineFullscreen
            ? "fixed inset-3 md:inset-6 z-[260] flex flex-col p-4 md:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700"
            : "flex-1 p-6 md:p-8 flex flex-col"
          }
        >

          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Timeline: {getDayFormatted(currentDate)}
            </h2>
            <div className="flex items-center space-x-3 text-slate-400 relative">
              <div ref={bellWrapRef} className="relative">
                {upcomingEvent ? (
                  <button
                    type="button"
                    onClick={() => { setShowReminders((v) => !v); jumpToUpcoming(); }}
                    className="flex items-center gap-2 mr-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    title="Klik untuk lihat pengingat"
                  >
                    <Bell className="w-4 h-4" /> {upcomingEvent.title} dalam {Math.ceil(upcomingEvent.diffMins)} mnt
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowReminders((v) => !v)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-indigo-500 transition-colors cursor-pointer"
                    title="Pengingat timeline"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                )}

                {showReminders && (
                  <div className="absolute right-0 top-8 mt-1 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-3 z-50 animate-fade-in text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Pengingat</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {upcomingEvent ? "Ada jadwal dekat." : "Belum ada jadwal dekat."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReminders(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                        title="Tutup"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {upcomingEvent && (
                      <div className="mt-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                          {upcomingEvent.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Mulai {upcomingEvent.isClass ? upcomingEvent.startTime : upcomingEvent.time} (sekitar {Math.ceil(upcomingEvent.diffMins)} menit lagi)
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => { jumpToUpcoming(); setShowReminders(false); }}
                            className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Lompat ke Jadwal
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowReminders(false); }}
                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-200 cursor-pointer"
                          >
                            Oke
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Notifikasi</p>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Notifikasi 10 menit sebelum
                        </div>
                        {alertsEnabled ? (
                          <button
                            type="button"
                            onClick={disableAlerts}
                            className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-black cursor-pointer"
                            title="Matikan notifikasi"
                          >
                            Aktif
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={requestEnableAlerts}
                            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-black cursor-pointer"
                            title="Aktifkan notifikasi"
                          >
                            Nyalakan
                          </button>
                        )}
                      </div>
                      {alertsEnabled && typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                          Izin notifikasi belum diberikan. Klik "Nyalakan" lalu izinkan di browser.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div ref={optionsWrapRef} className="relative">
                <MoreVertical
                  className="w-5 h-5 cursor-pointer hover:text-indigo-500 transition-colors"
                  onClick={() => setShowOptions(!showOptions)}
                />

                {showOptions && (
                  <div className="absolute right-0 top-8 mt-1 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-fade-in text-sm font-medium">
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                      onClick={() => { setIsTimelineFullscreen((v) => !v); setShowOptions(false); }}
                    >
                      <Target className="w-4 h-4" /> {isTimelineFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                      onClick={() => { jumpToNow(); setShowOptions(false); }}
                    >
                      <Clock className="w-4 h-4" /> Ke Jam Sekarang
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                      onClick={() => { exportSelectedDay(); setShowOptions(false); }}
                    >
                      <CalendarIcon className="w-4 h-4" /> Ekspor Jadwal (JSON)
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-2"
                      onClick={async () => {
                        const ok = await prodifyConfirm({
                          title: 'Hapus Jadwal',
                          message: `Hapus semua time block untuk tanggal ${dateStrKey}?`,
                          confirmText: 'Hapus',
                          cancelText: 'Batal',
                          danger: true,
                        });
                        if (ok && onClearBlocksForDate) onClearBlocksForDate(dateStrKey);
                        setShowOptions(false);
                      }}
                    >
                      <Inbox className="w-4 h-4" /> Hapus Jadwal Hari Ini
                    </button>
                    <div className="h-px w-full bg-slate-100 dark:bg-slate-700 my-1"></div>
                    <button className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-colors flex items-center gap-2" onClick={() => setShowOptions(false)}>
                      <X className="w-4 h-4" /> Tutup
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 py-3 px-4 ml-[60px] bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 shrink-0">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">Beban Mental Harian</span>
              </div>
              <div className="flex-1 max-w-sm bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden shadow-inner mx-4">
                <div className={`h-full rounded-full transition-all duration-700 ${isBurnout ? "bg-rose-500" : currentDailyEnergy >= MAX_DAILY_ENERGY * 0.8 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min((currentDailyEnergy / MAX_DAILY_ENERGY) * 100, 100)}%` }} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${isBurnout ? 'text-rose-500' : 'text-slate-400'}`}>
                {currentDailyEnergy} / {MAX_DAILY_ENERGY} Koin
              </span>
            </div>

            <div
              ref={timelineScrollRef}
              className={`relative flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfc] dark:bg-transparent ${isTimelineFullscreen ? 'max-h-[calc(100vh-220px)]' : 'max-h-[500px]'}`}
            >

              <div className="absolute inset-0 grid grid-cols-6 border-l border-slate-100 dark:border-slate-800/50 ml-[60px] pointer-events-none z-0">
                {[...Array(6)].map((_, i) => <div key={i} className="border-r border-slate-100 dark:border-slate-800/50 h-full"></div>)}
              </div>

              {timeGrid.map((hour) => {
                const blocksInHour = todayBlocks.filter((b) => b.time.startsWith(`${hour}:`));
                const currentDay = currentDate.getDay();
                const academicBlocksHere = academicSchedule.filter((s) => {
                  if (Number(s.dayOfWeek) !== currentDay) return false;
                  const startH = parseInt((s.startTime || "00:00").split(':')[0], 10);
                  let endH = parseInt((s.endTime || "00:00").split(':')[0], 10);
                  const endM = parseInt((s.endTime || "00:00").split(':')[1], 10);
                  if (endM === 0 && endH > startH) endH -= 1;
                  const currentH = parseInt(hour, 10);
                  return currentH >= startH && currentH <= endH;
                });

                const isDuringClass = academicBlocksHere.length > 0;
                const hasAnyBlock = blocksInHour.length > 0 || isDuringClass;

                return (
                  <div key={hour} data-hour={hour} className="flex min-h-[56px] border-b border-slate-100/80 dark:border-slate-800/80 group relative z-10 hover:bg-white dark:hover:bg-slate-800/30 transition-colors">

                    <div className="w-[60px] shrink-0 py-3 pr-3 flex flex-col items-end border-r border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-transparent">
                      <span className={`text-xs font-bold transition-colors ${hasAnyBlock ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        {hour}:00
                      </span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col justify-center gap-2 relative">

                      {/* 1. Bar Jadwal Akademik (Solid Dark Blue/Slate Pill) */}
                      {academicBlocksHere.map((acad) => (
                        <div key={`acad-${acad.id}`} className="h-9 w-11/12 md:w-4/5 rounded-full flex items-center justify-between px-4 text-xs font-bold text-white shadow-md bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600 hover:scale-[1.01] transition-transform ml-2">
                          <div className="flex items-center gap-2 truncate">
                            <BookOpen className="w-3.5 h-3.5 opacity-70 shrink-0" />
                            <span className="truncate drop-shadow-sm">{acad.course}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 opacity-80 font-medium">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {acad.startTime}-{acad.endTime}</span>
                            {acad.location && <span className="hidden sm:flex items-center gap-1"><MapPin className="w-3 h-3" /> {acad.location}</span>}
                          </div>
                        </div>
                      ))}

                      {/* 2. Bar Tugas Dinamis (Colorful Pill) */}
                      {blocksInHour.map((block, index) => {
                        const parentTask = tasks.find((t) => t.id === block.taskId);
                        const resolvedQuadrant = parentTask ? parentTask.quadrant : block.quadrant;
                        const categoryKey = block.category || parentTask?.category || "academic";
                        const catMeta = CATEGORY_META[categoryKey] || CATEGORY_META.academic;

                        const marginLeft = index === 1 ? 'ml-6' : index === 2 ? 'ml-12' : 'ml-2';
                        const barWidth = index === 0 ? 'w-full md:w-5/6' : 'w-11/12 md:w-3/4';

                        return (
                          <div key={block.id} className={`h-9 ${barWidth} ${marginLeft} rounded-full flex items-center justify-between px-4 text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all cursor-default group/bar ${getTaskGradient(resolvedQuadrant)}`}>
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm shrink-0 drop-shadow-md">{catMeta.icon}</span>
                              <span className="truncate drop-shadow-md tracking-wide">{block.title}</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="hidden sm:flex items-center gap-1 opacity-90 drop-shadow-sm bg-black/10 px-2 py-0.5 rounded-full">
                                <Target className="w-3 h-3" /> {block.energy} Koin
                              </span>
                              <button
                                onClick={() => removeBlock(dateStrKey, block.id)}
                                className="opacity-0 group-hover/bar:opacity-100 p-1 hover:bg-white/20 rounded-full transition-all cursor-pointer"
                                title="Hapus dari jadwal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
        <aside className="w-full xl:w-80 shrink-0 bg-slate-50/50 dark:bg-slate-800/40 border-t xl:border-t-0 xl:border-l border-slate-200/60 dark:border-slate-700/60 p-6 md:p-8 flex flex-col gap-6 transition-colors">

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full -mr-8 -mt-8 blur-xl pointer-events-none transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Goal Utama
                </h3>
                <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                  {isEditingGoal ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </button>
              </div>
              {isEditingGoal ? (
                <textarea
                  autoFocus
                  value={globalGoal}
                  onChange={(e) => setGlobalGoal(e.target.value)}
                  onBlur={() => setIsEditingGoal(false)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-semibold rounded-xl p-3 outline-none border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 resize-none custom-scrollbar"
                  rows={3}
                  placeholder="Apa target besarmu semester ini?"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors line-clamp-3" onClick={() => setIsEditingGoal(true)}>
                  "{globalGoal}"
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
            <h3 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"><Inbox className="w-4 h-4" /></div>
              Belum Dipetakkan
            </h3>

            <div className="space-y-3 overflow-y-auto flex-1 min-h-[150px] max-h-[350px] custom-scrollbar pr-1 transition-colors rounded-2xl">
              {tasks.filter((t) => !t.completed && t.quadrant === "unassigned").map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border shadow-sm flex items-start gap-3 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md transition-shadow transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug">{task.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {task.energy} Koin
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium truncate">
                        {CATEGORY_META[task.category]?.icon} {CATEGORY_META[task.category]?.label}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openMapModal(task)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Petakkan
                  </button>
                </div>
              ))}
              {tasks.filter((t) => !t.completed && t.quadrant === "unassigned").length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 opacity-60">
                  <CheckCircle className="w-8 h-8 mb-2 text-emerald-400" />
                  <p className="text-xs font-bold uppercase tracking-widest">Semua Terpetakan!</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {showMapModal && taskToMap && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> Petakkan Aktivitas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Pilih prioritas di Matrix untuk aktivitas ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowMapModal(false); setTaskToMap(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Aktivitas</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                {taskToMap.title}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Pilih Prioritas
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quadrants.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuadrant(q.id)}
                    className={`flex items-start gap-2 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      selectedQuadrant === q.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-200"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-500/60"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${q.bg}`}>
                      <q.icon className={`w-4 h-4 ${q.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-black uppercase tracking-widest ${q.color}`}>{q.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {q.id === "urgent-important" && "Segera dikerjakan hari ini."}
                        {q.id === "not-urgent-important" && "Jadwalkan di momen fokus terbaik."}
                        {q.id === "urgent-not-important" && "Bisa dibantu / didelegasikan."}
                        {q.id === "not-urgent-not-important" && "Pertimbangkan untuk ditunda atau dihapus."}
                      </p>
                    </div>
                    {selectedQuadrant === q.id && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowMapModal(false); setTaskToMap(null); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmMap}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Petakkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCalendar;
