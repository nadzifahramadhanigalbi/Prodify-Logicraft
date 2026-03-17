import React, { useEffect, useMemo, useState } from 'react';
import { User, Mail, GraduationCap, MapPin, Camera, Save, Phone, AtSign, TreePine, Award, BadgeCheck, Lock, Timer, CalendarCheck2, BookOpen, LayoutGrid, List, Flame, CheckCircle2, UserCheck } from 'lucide-react';
import { getJson, setJson } from '../utils/storage';
import { makeAvatarDataUri } from '../utils/avatar';
import { compressImageFileToDataUrl } from '../utils/image';
import { prodifyAlert } from '../utils/popup';

const getInitialProfile = () => {
    const baseProfile = {
        name: '', username: '', email: '', university: '', major: '', 
        location: '', phone: '', portfolio: '', bio: '', avatar: ''
    };
    const savedInfo = getJson('prodify_profileInfo', null);
    const userSession = getJson('prodify_user', {});

    if (savedInfo) {
        if (userSession.name) savedInfo.name = userSession.name;
        if (userSession.email) savedInfo.email = userSession.email;
        if (!savedInfo.username) savedInfo.username = (userSession.name || 'student').toLowerCase().replace(/\s+/g, '');
        return { ...baseProfile, ...savedInfo };
    }
    return baseProfile;
};

export default function Profile() {
    const [profile, setProfile] = useState(getInitialProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [habitsTick, setHabitsTick] = useState(0);
    const [syncTick, setSyncTick] = useState(0);
    const [forestStats, setForestStats] = useState(() => getJson('forest_stats', { planted: 0, dead: 0 }));
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        const sync = (e) => {
            const key = e?.key || e?.detail?.key;
            if (!key || key === 'forest_stats' || key === 'prodify_habits_v4') {
                setForestStats(getJson('forest_stats', { planted: 0, dead: 0 }));
            }
            if (!key || key === 'prodify_habits_v4') setHabitsTick((n) => n + 1);
            if (!key || key === 'prodify_tasks' || key === 'zen_pages_multi' || String(key).startsWith('forest_today_')) setSyncTick((n) => n + 1);
        };
        window.addEventListener('storage', sync);
        window.addEventListener('prodify-sync', sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener('prodify-sync', sync);
        };
    }, []);

    const { level, exp, title } = useMemo(() => {
        const habits = getJson('prodify_habits_v4', []);
        const totalExp = (habits.reduce((acc, h) => acc + (h?.streak || 0), 0) * 10) + ((forestStats?.planted || 0) * 25);
        const computedLevel = Math.floor(totalExp / 100) + 1;
        const getTitle = (lv) => {
            if (lv >= 25) return 'Deep Work Master';
            if (lv >= 18) return 'Discipline Architect';
            if (lv >= 12) return 'Consistency Builder';
            if (lv >= 7) return 'Momentum Seeker';
            return 'Novice Scholar';
        };
        return { level: computedLevel, exp: totalExp, title: getTitle(computedLevel) };
    }, [forestStats?.planted, habitsTick]);

    const achievements = useMemo(() => {
        const localDateKey = new Date().toISOString().split('T')[0];
        const focusToday = parseInt(getJson(`forest_today_${localDateKey}`, '0'), 10) || 0;
        
        const tasks = getJson('prodify_tasks', []);
        const onTimeCompleted = tasks.filter((t) => t?.completed && t?.deadline && t?.completedAt && new Date(t.completedAt).getTime() <= new Date(t.deadline).getTime()).length;
        const totalCompleted = tasks.filter((t) => t?.completed).length;

        const notesCount = (getJson('zen_pages_multi', []) || []).length;
        
        const habits = getJson('prodify_habits_v4', []);
        const maxHabitStreak = Math.max(0, ...habits.map(h => h.streak || 0));

        return [
            { id: 'iron_focus', title: 'Iron Focus', desc: '5 Sesi Fokus hari ini', icon: Timer, unlocked: focusToday >= 5 },
            { id: 'master_of_time', title: 'Master of Time', desc: '10 Tugas tepat waktu', icon: CalendarCheck2, unlocked: onTimeCompleted >= 10 },
            { id: 'forest_builder', title: 'Forest Builder', desc: 'Tanam 25 pohon', icon: TreePine, unlocked: (forestStats?.planted || 0) >= 25 },
            { id: 'note_scholar', title: 'Note Scholar', desc: 'Buat 10 ZenNotes', icon: BookOpen, unlocked: notesCount >= 10 },
            { id: 'consistency_king', title: 'Consistency King', desc: '7 Hari Habit Streak', icon: Flame, unlocked: maxHabitStreak >= 7 },
            { id: 'task_master', title: 'Task Master', desc: 'Selesaikan 20 Tugas', icon: CheckCircle2, unlocked: totalCompleted >= 20 },
            { id: 'identity_forged', title: 'Identity Forged', desc: 'Lengkapi Bio & Foto', icon: UserCheck, unlocked: !!(profile.avatar && profile.bio && profile.bio.length > 5) },
        ];
    }, [syncTick, forestStats?.planted, profile.avatar, profile.bio]);

    const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handleSave = () => {
        const cleaned = { ...profile, username: profile.username.trim().toLowerCase().replace(/\s+/g, '') };
        setJson('prodify_profileInfo', cleaned);
        setProfile(cleaned);
        setIsEditing(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await compressImageFileToDataUrl(file, { maxDimension: 300, maxBytes: 100 * 1024, preferType: 'image/webp', quality: 0.72 });
            setProfile(prev => ({ ...prev, avatar: dataUrl }));
            setJson('prodify_profileInfo', { ...profile, avatar: dataUrl });
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up pb-20 lg:pb-0 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Profil Mahasiswa</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Kelola identitas akademismu.</p>
                </div>
                <button onClick={isEditing ? handleSave : () => setIsEditing(true)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${isEditing ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {isEditing ? <><Save className="w-4 h-4" /> Simpan</> : 'Edit Profil'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="flex flex-col gap-6 md:col-span-1">
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-slate-700/60 p-6 flex flex-col gap-6 shadow-sm relative overflow-hidden transition-colors h-fit">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
                        
                        <div className="flex flex-col items-center text-center z-10 pt-4">
                            <div className="relative group">
                                <img src={profile.avatar || makeAvatarDataUri(profile.name || 'Student')} alt="Profile" className="w-28 h-28 rounded-full ring-4 ring-indigo-50 dark:ring-indigo-900 shadow-xl object-cover" />
                                <label className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:text-indigo-600 transition-colors">
                                    <Camera className="w-4 h-4" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mt-4 leading-tight">{profile.name || 'User'}</h3>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">@{profile.username || 'username'}</p>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                        <div className="w-full">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-300 mb-3">Academic Badge</p>
                            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/5 dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                                        <Award className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase">{title}</h4>
                                        <p className="text-[10px] font-bold text-slate-500">Level {level} • {exp} EXP</p>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-indigo-500 h-full transition-all" style={{ width: `${exp % 100}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Badges</p>
                                <button 
                                    onClick={() => setShowDetail(!showDetail)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                                    title={showDetail ? "Tampilan Grid" : "Tampilan Detail"}
                                >
                                    {showDetail ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            {showDetail ? (
                                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 pb-1 scrollbar-thin">
                                    {achievements.map((a) => (
                                        <div key={a.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${a.unlocked ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/50'}`}>
                                            <div className={`p-2 rounded-xl ${a.unlocked ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'bg-transparent text-slate-300'}`}>
                                                <a.icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[11px] font-black truncate ${a.unlocked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{a.title}</p>
                                                <p className="text-[9px] font-bold text-slate-500 truncate">{a.desc}</p>
                                            </div>
                                            {a.unlocked ? <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" /> : <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2">
                                    {achievements.map((a) => (
                                        <div key={a.id} className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${a.unlocked ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-300'}`} title={`${a.title} - ${a.desc}`}>
                                            <a.icon className="w-5 h-5" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-slate-700/60 p-6 md:p-8 shadow-sm md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><User className="w-3.5 h-3.5 text-indigo-400" /> Nama Lengkap</label>
                            <input type="text" name="name" value={profile.name} onChange={handleChange} disabled={!isEditing} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><AtSign className="w-3.5 h-3.5 text-indigo-400" /> Username</label>
                            <input type="text" name="username" value={profile.username} onChange={handleChange} disabled={!isEditing} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Universitas</label>
                            <input type="text" name="university" value={profile.university} onChange={handleChange} disabled={!isEditing} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> Lokasi</label>
                            <input type="text" name="location" value={profile.location} onChange={handleChange} disabled={!isEditing} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2 sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Bio Singkat</label>
                            <textarea name="bio" value={profile.bio} onChange={handleChange} disabled={!isEditing} rows={3} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 transition-all resize-none" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}