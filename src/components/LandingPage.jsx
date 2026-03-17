import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Target, Shield, ListChecks, Activity,
  CalendarDays, BarChart2, Star, BookOpen, Focus, Flame, ChevronDown,
  Users, BookMarked, Briefcase, Brain
} from 'lucide-react';
import { triggerDemoData } from '../utils/demoData';
import HeroSection from './HeroSection';

export default function LandingPage({ onStart }) {
  const handleNormalStart = (e) => {
    if (e) e.preventDefault();
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('isDemoMode');
      window.sessionStorage.clear();
    }
    onStart();
  };

  const handleDemoLaunch = (e) => {
    if (e) e.preventDefault();
    triggerDemoData();
    onStart();
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDemoLaunch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const BENEFITS = [
    { icon: Target, title: "Fokus Skripsi / Jurnal", desc: "Prioritaskan bab skripsi dan bacaan jurnal tanpa terdistraksi media sosial." },
    { icon: Shield, title: "Anti-Panik Deadline", desc: "Pengingat otomatis H-1 untuk tugas besar. Ucapkan selamat tinggal pada SKS (Sistem Kebut Semalam)." },
    { icon: ListChecks, title: "Organisasi Mata Kuliah", desc: "Pisahkan tugas individu, kelompok, dan kepanitiaan dalam satu matriks yang rapi." },
    { icon: Activity, title: "Pencegahan Burnout", desc: "Sistem AI yang mendeteksi beban kerjamu dan memandu istirahat jika jadwal terlalu padat." }
  ];

  const PERSONAS = [
    { icon: BookMarked, title: "Pejuang Skripsi & Tugas Akhir", desc: "Butuh fokus mendalam. Manfaatkan fitur Deep Focus dan ZenNotes untuk merangkum jurnal tanpa gangguan.", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
    { icon: Briefcase, title: "Aktivis BEM & Organisasi", desc: "Jadwal padat rapat dan kuliah. Gunakan Eisenhower Matrix untuk memfilter mana yang penting dan darurat.", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
    { icon: Users, title: "Mahasiswa Self-Improvement", desc: "Ingin bangun kebiasaan baru. Habit Tracker membantu melacak jadwal olahraga, baca buku, hingga hidrasi.", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20" },
  ];

  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  const FAQS = [
    { q: "Apakah Prodify gratis untuk mahasiswa?", a: "Ya! Prodify 100% gratis dan berjalan di browser-mu secara offline. Tidak ada biaya langganan bulanan." },
    { q: "Apa itu fitur 'Cognitive Guard' (Anti-Burnout)?", a: "Ini adalah inovasi Prodify yang menghitung total beban tugas harianmu. Jika terlalu berat (Overload), layar otomatis terkunci selama 1 menit dan memandu kamu melakukan teknik pernapasan 4-7-8 untuk mencegah stres." },
    { q: "Apakah data jadwal dan tugas saya aman?", a: "Sangat aman. Prodify menggunakan teknologi Local Storage. Artinya, datamu tidak pernah dikirim ke server kami, melainkan tersimpan eksklusif di laptop/HP kamu sendiri." },
    { q: "Bagaimana cara kerja fitur Gamifikasi?", a: "Setiap kamu menyelesaikan tugas tepat waktu atau menjaga rutinitas harian, kamu mendapat EXP. EXP ini digunakan untuk menaikkan Level kamu dan memelihara 'Neko' (maskot virtual) serta menanam pohon." },
    { q: "Apakah bisa dibuka di HP?", a: "Tentu. Prodify dirancang responsif sehingga bisa dibuka nyaman lewat browser HP saat kamu sedang di kelas atau di jalan." },
  ];

  const TESTIMONIALS = [
    { name: "Rina Safitri", role: "Mahasiswa Teknik Informatika", content: "Sejak pakai Prodify, IPK aku naik dari 3.2 jadi 3.8! Semua tugas jadi terorganisir dan nggak pernah telat kumpulin lagi.", avatar: "RS" },
    { name: "Ahmad Fauzan", role: "Aktivis Kampus", content: "Eisenhower Matrix-nya life saver banget. Aku bisa menyeimbangkan antara kuliah, proker organisasi, dan part-time job tanpa burnout.", avatar: "AF" },
    { name: "Dina Maharani", role: "Pejuang Skripsi", content: "Fitur Deep Focus dan Anti-Cheat beneran bikin aku stop buka TikTok pas lagi nulis Bab 2. Keren banget inovasinya!", avatar: "DM" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050814] text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#050814]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-colors">
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-20 px-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-2 shadow-lg shadow-slate-200/40 dark:shadow-slate-950/40">
              <img src="/brand-logo.png" alt="Prodify Logo" className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">Prodi<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">fy</span></span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Bento Fitur</a>
            <a href="#personas" onClick={(e) => handleNavClick(e, 'personas')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Untuk Siapa?</a>
            <a href="#testimonials" onClick={(e) => handleNavClick(e, 'testimonials')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Testimoni</a>
            <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">FAQ</a>
          </div>
          <button onClick={handleNormalStart} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg cursor-pointer">
            Masuk / Daftar
          </button>
        </div>
      </nav>

      <HeroSection onStart={handleNormalStart} onDemo={handleDemoLaunch} />

      {/* Marquee Benefits */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900/50 border-y border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="w-full relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
          <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
            {[...BENEFITS, ...BENEFITS].map((item, idx) => (
              <div key={idx}
                className="group w-[300px] md:w-[360px] shrink-0 p-8 rounded-[2rem] bg-indigo-500/5 dark:bg-white/[0.06] backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center aspect-[4/3]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/30">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black mb-3">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES SECTION - INI YANG BIKIN "WOW" */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Pilar Ekosistem <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Prodify</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">Sistem All-in-One yang menggantikan 5 aplikasi berbeda di HP kamu.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[250px]">
            
            {/* Bento Box 1: Activity Manager (Besar Kiri) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 relative group p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden hover:-translate-y-1 transition-all"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-6">
                <CalendarDays className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-3xl font-black mb-4">Activity Manager <br/>& Eisenhower Matrix</h3>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-md">Filter puluhan tugas kuliahmu ke dalam kuadran prioritas. Kerjakan yang Urgent, jadwalkan yang Important.</p>
            </motion.div>

            {/* Bento Box 2: Cognitive Guard (Highlight Inovasi Warna Berbeda) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="col-span-1 md:col-span-1 lg:col-span-2 row-span-1 relative group p-8 rounded-[2.5rem] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-xl overflow-hidden hover:-translate-y-1 transition-all flex flex-col justify-center"
            >
              <div className="absolute right-[-10%] top-[-10%] opacity-20"><Brain className="w-48 h-48"/></div>
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur text-white text-[10px] font-black uppercase rounded-full w-max mb-3">AI Innovation</span>
              <h3 className="text-2xl font-black mb-2">Cognitive Guard</h3>
              <p className="text-white/90 font-medium text-sm">Sistem cerdas pencegah Burnout. Memandu teknik pernapasan 4-7-8 otomatis jika tugasmu terlalu padat.</p>
            </motion.div>

            {/* Bento Box 3: Zen Notes */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1 relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col justify-end hover:-translate-y-1 transition-all"
            >
              <BookOpen className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-black mb-2">Zen Notes</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Catat materi kuliah tanpa batas. Bersih & bebas distraksi.</p>
            </motion.div>

            {/* Bento Box 4: Deep Focus */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1 relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col justify-end hover:-translate-y-1 transition-all"
            >
              <Focus className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-xl font-black mb-2">Deep Focus</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pomodoro Timer dengan fitur *Anti-Cheat* & menanam pohon virtual.</p>
            </motion.div>

            {/* Bento Box 5: Habit Tracker (Bawah Lebar) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
              className="col-span-1 md:col-span-3 lg:col-span-4 row-span-1 relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden hover:-translate-y-1 transition-all flex flex-col md:flex-row items-start md:items-center justify-between"
            >
               <div className="absolute top-1/2 left-1/2 w-full h-full bg-emerald-500/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
               <div className="max-w-xl z-10">
                 <div className="flex items-center gap-3 mb-3">
                    <Flame className="w-8 h-8 text-emerald-500" />
                    <h3 className="text-2xl font-black">Atomic Habit Tracker</h3>
                 </div>
                 <p className="text-slate-500 dark:text-slate-400 font-medium">Bangun pilar kebiasaan sehat (Kognitif, Vitalitas, Sosial, Mental). Selesaikan rutinitas untuk menyalakan konstelasi sinergi harianmu.</p>
               </div>
               <div className="mt-6 md:mt-0 z-10">
                  <BarChart2 className="w-20 h-20 text-slate-200 dark:text-slate-700" />
               </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* STUDENT PERSONA SECTION */}
      <section id="personas" className="py-24 bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Siapa yang Paling <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Terbantu?</span></h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Prodify didesain memahami berbagai tipe perjuangan mahasiswa.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERSONAS.map((persona, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className={`p-8 rounded-[2rem] border ${persona.bg} flex flex-col items-center text-center`}
              >
                <div className={`w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm`}>
                  <persona.icon className={`w-8 h-8 ${persona.color}`} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3">{persona.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{persona.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Apa kata <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">mereka?</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Testimoni dari mahasiswa yang sudah merasakan manfaat Prodify.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-[2rem] bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xl hover:-translate-y-2 transition-transform duration-300">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed font-medium text-lg italic">"{item.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-32 bg-white dark:bg-slate-900/50 border-y border-slate-100 dark:border-white/5">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Pertanyaan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Umum</span></h2>
          </motion.div>

          <div className="flex flex-col gap-4">
            {FAQS.map((faq, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}>
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-6 py-5 md:px-8 md:py-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{faq.q}</h3>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-indigo-500' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="pt-4 text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 md:p-10 text-center overflow-hidden shadow-2xl shadow-indigo-600/30 border border-indigo-400/30">
            
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
                Upgrade cara kamu mengatur<br className="hidden sm:block" /> hidup sebagai mahasiswa.
              </h2>
              <p className="text-indigo-100 text-sm md:text-base mb-6 max-w-lg mx-auto font-medium leading-relaxed">
                Bergabung dengan ekosistem yang sudah membuktikan peningkatan produktivitas tanpa stres berlebih.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                 <button onClick={handleNormalStart} className="px-6 py-3 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-sm md:text-base transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 flex items-center justify-center gap-2 cursor-pointer">
                   Masuk / Daftar <ArrowRight className="w-4 h-4" />
                 </button>
                 <button onClick={handleDemoLaunch} className="px-6 py-3 bg-transparent border-2 border-indigo-300/60 hover:border-white text-white rounded-xl font-bold text-sm md:text-base transition-all hover:bg-white/10 flex items-center justify-center cursor-pointer">
                   Coba Demo Dulu
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="pt-16 pb-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#050814]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-3">
                <div className="bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-2 shadow-sm">
                  <img src="/brand-logo.png" alt="Prodify Logo" className="h-6 w-6" />
                </div>
                <span className="text-2xl font-black tracking-tight">Prodi<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">fy</span></span>
              </div>
              <div className="flex gap-6">
                 <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 transition-colors">Fitur</a>
                 <a href="#personas" onClick={(e) => handleNavClick(e, 'personas')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 transition-colors">Untuk Siapa?</a>
                 <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 transition-colors">FAQ</a>
              </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 text-center">
              © {new Date().getFullYear()} Prodify. Ekosistem Produktivitas Mahasiswa. Dibuat untuk IFEST 14.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}