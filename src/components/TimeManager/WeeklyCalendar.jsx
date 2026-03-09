import React from 'react';
import { Calendar as CalendarIcon, Target, Inbox, Sun, Sparkles, AlertTriangle, GripVertical, X, Check, Edit2, Clock } from 'lucide-react';
import { Droppable, Draggable } from "@hello-pangea/dnd";

const CATEGORY_META = {
  academic: {
    label: "Akademik",
    badge: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-500/30",
  },
  organization: {
    label: "Organisasi",
    badge: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-500/30",
  },
  committee: {
    label: "Kepanitiaan",
    badge: "bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-100 dark:border-fuchsia-500/30",
  },
  work: {
    label: "Kerja Part-time",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/30",
  },
  personal: {
    label: "Pribadi/Keluarga",
    badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-500/30",
  },
  project: {
    label: "Project/Skripsi",
    badge: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-500/30",
  },
};

const WeeklyCalendar = ({
  next7Days,
  currentDate,
  setCurrentDate,
  isSameDay,
  scheduledBlocks,
  getDayFormatted,
  todayBlocks,
  isBurnout,
  currentDailyEnergy,
  MAX_DAILY_ENERGY,
  synergyState,
  tasks,
  quadrants,
  removeBlock,
  dateStrKey,
  globalGoal,
  setGlobalGoal,
  isEditingGoal,
  setIsEditingGoal,
  academicSchedule = []
}) => {
  // Generate Array Jam 00 - 23 untuk UI Grid Calendar
  const timeGrid = Array.from({ length: 24 }, (_, i) => {
    return `${i.toString().padStart(2, '0')}`;
  });

  return (
    <div className="liquid-glass dark:bg-slate-900/60 dark:border-slate-700/50 rounded-3xl spatial-shadow overflow-hidden transition-colors">
      {/* 7-Day Pill Selector */}
      <div className="p-5 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Kalender 7-Hari Ke Depan
        </h2>
      </div>
      <div className="flex gap-2 overflow-x-auto p-4 border-b border-slate-100 dark:border-slate-800 custom-scrollbar pb-4">
        {next7Days.map((day, idx) => {
          const isSelected = isSameDay(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const dateKey = day.toISOString().split("T")[0];
          const blocksCount = (scheduledBlocks[dateKey] || []).length;
          return (
            <button
              key={idx}
              onClick={() => setCurrentDate(day)}
              className={`shrink-0 w-[88px] flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer ${isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 scale-105" : "bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"}`}>
                {day.toLocaleDateString("id-ID", { weekday: "short" })}
              </span>
              <span className="text-2xl font-black my-1">{day.getDate()}</span>
              {blocksCount > 0 ? (
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-emerald-400" : "bg-indigo-500 dark:bg-indigo-400"}`}></div>
                  {blocksCount}
                </div>
              ) : (
                <span className={`text-[10px] font-bold ${isSelected ? "text-indigo-300" : "text-slate-400 dark:text-slate-500"}`}>
                  {isToday ? "Hari Ini" : "Kosong"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule Content */}
      <div className="flex flex-col md:flex-row gap-0">
        {/* Timeline */}
        <div className="flex-1 p-6">
          {/* Energy Barometer */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 mb-6 shadow-sm relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" /> Kapasitas Mental Harian
                </h3>
                <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md border ${isBurnout ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20" : currentDailyEnergy >= MAX_DAILY_ENERGY * 0.8 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"}`}>
                  {currentDailyEnergy} / {MAX_DAILY_ENERGY} Koin
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isBurnout ? "bg-rose-500" : currentDailyEnergy >= MAX_DAILY_ENERGY * 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((currentDailyEnergy / MAX_DAILY_ENERGY) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5">
                  <div className={`p-1 rounded-lg border ${synergyState === "buffed" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" : synergyState === "debuffed" ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"}`}>
                    <Sparkles className={`w-3.5 h-3.5 ${synergyState === "buffed" ? "text-emerald-500 dark:text-emerald-400" : synergyState === "debuffed" ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Synergy: <span className={synergyState === "buffed" ? "text-emerald-600 dark:text-emerald-400" : synergyState === "debuffed" ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-300"}>
                      {synergyState === "buffed" ? "ASCENDED (+3)" : synergyState === "debuffed" ? "BURNOUT (-3)" : "NORMAL"}
                    </span>
                  </span>
                </div>
                {isBurnout && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> Overload!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> {getDayFormatted(currentDate)}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-lg shadow-sm">
              Time Blocking Model
            </span>
          </div>

          {/* Timeline Blocks - EXPERT TIME BLOCKING UI */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-y-auto max-h-[450px] custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30 shadow-inner relative">
            {/* Garis Vertikal Timeline (Background) */}
            <div className="absolute left-[64px] top-0 bottom-0 w-[2px] bg-slate-200/60 dark:bg-slate-700/60"></div>

            {timeGrid.map((hour) => {
              // Cek apakah ada tugas yang jadwalnya dimulai di jam ini
              const blocksInHour = todayBlocks.filter((b) => b.time.startsWith(`${hour}:`));
              const currentDay = currentDate.getDay();
              const academicHere = academicSchedule.some((s) => {
                if (s.dayOfWeek !== currentDay) return false;
                // simple hour overlap check
                const startHour = parseInt((s.startTime || "00:00").slice(0, 2), 10);
                const endHour = parseInt((s.endTime || "00:00").slice(0, 2), 10);
                const h = parseInt(hour, 10);
                return h >= startHour && h < endHour;
              });
              
              return (
                <div
                  key={hour}
                  className={`flex min-h-[64px] border-b border-slate-200/60 dark:border-slate-700/60 last:border-b-0 group relative ${
                    academicHere ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""
                  }`}
                >
                  
                  {/* Kolom Jam */}
                  <div className="w-[64px] shrink-0 py-3 pr-4 flex flex-col items-end z-10">
                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      {hour}:00
                    </span>
                  </div>

                  {/* Area Konten Tugas di Jam Tersebut */}
                  <div className="flex-1 p-2 flex flex-col gap-2 relative z-10">
                    {/* Jika Kosong, tampilkan slot yang bisa dihover */}
                    {blocksInHour.length === 0 ? (
                      <div className="w-full h-full min-h-[40px] border border-transparent group-hover:border-dashed group-hover:border-slate-300 dark:group-hover:border-slate-600 rounded-xl transition-colors"></div>
                    ) : (
                      // Render Blok Tugas
                      blocksInHour.map((block) => {
                        const parentTask = tasks.find((t) => t.id === block.taskId);
                        const resolvedQuadrant = parentTask ? parentTask.quadrant : block.quadrant;
                        const quad = quadrants.find((q) => q.id === resolvedQuadrant) || {
                          title: "Belum diprioritaskan",
                          color: "text-slate-400",
                          bg: "bg-slate-100 dark:bg-slate-800",
                          border: "border-slate-300 dark:border-slate-600",
                        };

                        const categoryKey = block.category || parentTask?.category || "academic";
                        const catMeta = CATEGORY_META[categoryKey] || CATEGORY_META.academic;

                        return (
                          <div
                            key={block.id}
                            className={`flex items-start sm:items-center gap-3 p-3 rounded-xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default ${quad.bg} ${quad.border}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                                  {block.time}
                                </span>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">
                                  {block.title}
                                </h4>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${quad.color}`}>
                                  {quad.title}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-0.5 shrink-0">
                                  <Target className="w-3 h-3" /> {block.energy} Koin
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catMeta.badge}`}
                                >
                                  {catMeta.label}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeBlock(dateStrKey, block.id)}
                              className="text-slate-400 hover:text-rose-500 bg-white/50 hover:bg-rose-50 dark:bg-slate-900/50 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-colors cursor-pointer self-center shrink-0 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                              title="Hapus dari jadwal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Goals & Unassigned Drop Zone */}
        <div className="w-full md:w-72 shrink-0 bg-white/60 dark:bg-slate-800/40 border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-700/60 p-5 flex flex-col gap-6 transition-colors">

          {/* WIDGET GOALS / TARGET SEMESTER */}
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 dark:from-indigo-600 dark:via-indigo-800 dark:to-violet-900 rounded-[1.5rem] p-5 text-white shadow-lg relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-indigo-200 dark:text-indigo-300 flex items-center gap-1.5 bg-black/20 dark:bg-black/40 px-2 py-1 rounded-md">
                  <Target className="w-3 h-3 text-amber-300" /> Goal Utama Semester
                </h3>
                <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="p-1 hover:bg-white/20 dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10">
                  {isEditingGoal ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Edit2 className="w-3.5 h-3.5 text-indigo-100" />}
                </button>
              </div>
              {isEditingGoal ? (
                <textarea
                  autoFocus
                  value={globalGoal}
                  onChange={(e) => setGlobalGoal(e.target.value)}
                  onBlur={() => setIsEditingGoal(false)}
                  className="w-full bg-black/20 dark:bg-black/40 text-white text-sm font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-white/50 resize-none border border-white/20 dark:border-white/10 custom-scrollbar"
                  rows={3}
                  placeholder="Apa target besarmu semester ini?"
                />
              ) : (
                <p className="text-sm font-bold leading-relaxed shadow-sm cursor-pointer hover:bg-white/5 dark:hover:bg-black/20 p-2 rounded-xl transition-colors -mx-2 border border-transparent hover:border-white/10 dark:hover:border-white/5 line-clamp-3" onClick={() => setIsEditingGoal(true)}>
                  "{globalGoal}"
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2 text-sm">
              <Inbox className="w-4 h-4 text-indigo-400" /> Belum Diprioritaskan
            </h3>
            <Droppable droppableId="unassigned">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 overflow-y-auto flex-1 min-h-[120px] max-h-[300px] custom-scrollbar pr-1 transition-colors rounded-xl p-2 ${snapshot.isDraggingOver ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 border-dashed" : ""}`}
                >
                  {tasks.filter((t) => !t.completed && t.quadrant === "unassigned").map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={provided.draggableProps.style}
                          className={`bg-white dark:bg-slate-800 p-3 rounded-xl border shadow-sm flex items-center gap-2 cursor-grab active:cursor-grabbing transition-shadow transition-colors ${snapshot.isDragging ? "border-indigo-400 shadow-xl scale-105 ring-2 ring-indigo-300 z-50 relative" : "border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50"}`}
                        >
                          <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-2 leading-tight">{task.title}</p>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {tasks.filter((t) => !t.completed && t.quadrant === "unassigned").length === 0 && !snapshot.isDraggingOver && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      Semua agenda sudah dipetakan! ✅
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;