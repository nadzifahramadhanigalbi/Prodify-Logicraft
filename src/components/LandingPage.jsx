import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ArrowRight, Menu, X, 
  Terminal, Shield, Zap, Target, BookOpen, Brain, 
  Code, Trophy, Calendar, Users, Hexagon, Layout, ShieldCheck
} from 'lucide-react';

const MotionDiv = motion.div;

export default function LandingPage({ onStart }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // --- COUNTDOWN LOGIC ---
  const calculateTimeLeft = () => {
    const targetDate = new Date("2026-03-07T23:59:59").getTime(); 
    const now = new Date().getTime();
    const difference = targetDate - now;

    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        Days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        Hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        Minutes: Math.floor((difference / 1000 / 60) % 60),
        Seconds: Math.floor((difference / 1000) % 60)
      };
    } else {
      timeLeft = { Days: 0, Hours: 0, Minutes: 0, Seconds: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const faqs = [
    { q: "Siapa yang dapat mengikuti kompetisi ini?", a: "Peserta adalah mahasiswa/i aktif perguruan tinggi di seluruh Indonesia, dalam tim berisi 1-3 orang dari institusi yang sama." },
    { q: "Berapa biaya pendaftarannya?", a: "Biaya pendaftaran adalah Rp 50.000 per tim, dibayarkan melalui rekening Bank Jago yang tertera di Rulebook." },
    { q: "Apakah boleh menggunakan framework Backend?", a: "Tidak. Penilaian hanya dilakukan pada bagian Frontend (Full Design). Framework backend seperti Laravel, Django, atau SpringBoot dilarang." },
    { q: "Platform hosting apa yang disarankan?", a: "Peserta bebas menggunakan platform hosting apapun, namun sangat disarankan menggunakan Vercel." }
  ];

  return (
    <div className="min-h-screen bg-[#050814] text-slate-300 font-sans selection:bg-[#00f0ff]/30 overflow-x-hidden">
      
      {/* ========== BACKGROUND GLOW ORBS (Find IT Aesthetic) ========== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#00f0ff]/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#7000ff]/15 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* ========== NAVBAR ========== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#050814]/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer z-50">
            <span className="text-2xl font-black tracking-widest text-white uppercase italic">
              STU<span className="text-[#00f0ff]">PROD</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10 text-[13px] font-bold tracking-[0.1em] text-white/80 uppercase">
            <a href="#about" className="hover:text-[#00f0ff] transition-colors">About Us</a>
            <a href="#modules" className="hover:text-[#00f0ff] transition-colors">Our Events</a>
            <a href="#faq" className="hover:text-[#00f0ff] transition-colors">FAQ</a>
          </div>

          {/* Login/Register Button */}
          <button onClick={onStart} className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#0055ff] hover:brightness-110 text-white font-bold rounded-full transition-all text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer">
            Login
          </button>

          {/* Mobile Toggle */}
          <button className="md:hidden text-white z-50 cursor-pointer" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <MotionDiv 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-[#050814] border-b border-white/10 p-6 flex flex-col gap-6 md:hidden"
            >
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-white font-bold uppercase tracking-widest">About Us</a>
              <a href="#modules" onClick={() => setMobileMenuOpen(false)} className="text-white font-bold uppercase tracking-widest">Our Events</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-white font-bold uppercase tracking-widest">FAQ</a>
              <button onClick={onStart} className="w-full py-3 bg-gradient-to-r from-[#00f0ff] to-[#0055ff] text-white font-bold uppercase tracking-widest rounded-lg cursor-pointer">
                Login / Register
              </button>
            </MotionDiv>
          )}
        </AnimatePresence>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-6 text-center">
        
        {/* Decorative Tech Icons */}
        <MotionDiv animate={{ y: [-15, 15, -15] }} transition={{ duration: 6, repeat: Infinity }} className="absolute left-[15%] top-[30%] opacity-20 hidden lg:block">
          <Code className="w-20 h-20 text-[#00f0ff]" />
        </MotionDiv>
        <MotionDiv animate={{ y: [15, -15, 15] }} transition={{ duration: 7, repeat: Infinity }} className="absolute right-[15%] top-[40%] opacity-20 hidden lg:block">
          <Terminal className="w-24 h-24 text-[#7000ff]" />
        </MotionDiv>

        <MotionDiv initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-[1000px] w-full relative z-10">
          
          <h2 className="text-[#00f0ff] font-bold tracking-[0.3em] uppercase mb-6 text-sm md:text-base">
            WEB DEVELOPMENT COMPETITION 2026
          </h2>
          
          <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-black text-white leading-[1] tracking-tighter mb-8 uppercase drop-shadow-2xl">
            ARE YOU READY TO<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#0055ff] to-[#7000ff]">
              COMPETE?
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Take control of your academic life. StuProd is the ultimate Local-First productivity ecosystem built to eliminate procrastination.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button onClick={onStart} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#00f0ff] to-[#0055ff] text-white font-black text-lg uppercase tracking-wider rounded-lg hover:scale-105 transition-all hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] cursor-pointer">
              Register Now
            </button>
            <a href="#about" className="w-full sm:w-auto px-10 py-4 bg-transparent border-2 border-[#00f0ff]/50 text-[#00f0ff] font-black text-lg uppercase tracking-wider rounded-lg hover:bg-[#00f0ff]/10 transition-all cursor-pointer">
              Learn More
            </a>
          </div>
        </MotionDiv>
      </section>

      {/* ========== WHAT IS (ABOUT) ========== */}
      <section id="about" className="relative z-10 py-24 px-6 bg-[#070A14] border-y border-white/5">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <MotionDiv initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">
              What is <span className="text-[#00f0ff]">StuProd?</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-6 text-justify">
              <strong>StuProd (Student Productivity)</strong> adalah sistem berbasis web statis (Local-First) yang dirancang khusus untuk memecahkan masalah manajemen waktu mahasiswa yang kompleks tanpa bergantung pada server eksternal.
            </p>
            <p className="text-slate-400 text-lg leading-relaxed text-justify">
              Sesuai tema "Empowering Students Through Innovative Productivity Tools", aplikasi ini menggabungkan fitur pencatatan tingkat lanjut, matriks prioritas, fokus mendalam, dan gamifikasi ke dalam satu ekosistem yang terintegrasi 100%.
            </p>
            <button onClick={onStart} className="mt-8 px-8 py-3 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10 font-bold uppercase tracking-widest rounded transition-all cursor-pointer">
              Try Dashboard
            </button>
          </MotionDiv>
          
          <MotionDiv initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
            <div className="aspect-square md:aspect-video bg-gradient-to-br from-[#00f0ff]/10 to-[#7000ff]/10 border border-white/10 rounded-2xl flex items-center justify-center p-8 backdrop-blur-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               <Layout className="w-32 h-32 text-[#00f0ff]/50 drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]" />
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* ========== WHY YOU SHOULD JOIN ========== */}
      <section className="relative z-10 py-24 px-6 max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            Why You Should <span className="text-[#00f0ff]">Join</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Shield />, title: "100% Privacy", desc: "Data terkunci aman di browser. Tidak ada server eksternal yang memata-matai." },
            { icon: <Zap />, title: "Zero Latency", desc: "Performa secepat kilat karena beroperasi penuh di sisi klien (Frontend-Only)." },
            { icon: <Trophy />, title: "Gamified Workflow", desc: "Ubah stres akademik menjadi tantangan seru dengan sistem Leveling dan Koin Energi." }
          ].map((item, i) => (
            <MotionDiv key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-[#0a0d1a] border border-white/10 p-10 rounded-xl hover:border-[#00f0ff]/50 transition-colors group">
              <div className="w-16 h-16 bg-[#00f0ff]/10 rounded-full flex items-center justify-center text-[#00f0ff] mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed">{item.desc}</p>
            </MotionDiv>
          ))}
        </div>
      </section>

      {/* ========== WHO CAN JOIN ========== */}
      <section className="relative z-10 py-24 px-6 bg-gradient-to-b from-[#070A14] to-[#050814] border-t border-white/5">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-16">
            Who Can <span className="text-[#00f0ff]">Join?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Mahasiswa Aktif', 'Tim 1-3 Orang', 'Institusi Sama', 'Seluruh Indonesia'].map((role, i) => (
              <div key={i} className="py-8 px-4 bg-[#0a0d1a] border border-white/10 hover:border-[#7000ff]/50 rounded-xl text-[#00f0ff] font-bold uppercase tracking-wider flex flex-col items-center gap-4 transition-colors">
                <Users className="w-10 h-10 text-white/50" />
                {role}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CHOOSE YOUR PATH (OUR MODULES) ========== */}
      <section id="modules" className="relative z-10 py-24 px-6 max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            Choose Your <span className="text-[#00f0ff]">Path</span>
          </h2>
          <p className="text-slate-400 mt-4 text-lg">Eksplorasi 4 Modul Utama Produktivitas</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Balance Matrix", icon: <Target />, color: "border-[#ff0055]" },
            { title: "Smart Notes", icon: <BookOpen />, color: "border-[#00ff88]" },
            { title: "Deep Focus", icon: <Brain />, color: "border-[#00f0ff]" },
            { title: "Cognitive Guard", icon: <ShieldCheck />, color: "border-[#7000ff]" }
          ].map((path, i) => (
            <MotionDiv key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`bg-[#0a0d1a] p-8 border-t-4 ${path.color} rounded-b-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
              <div className="text-white/30 mb-6">{React.cloneElement(path.icon, { className: "w-12 h-12" })}</div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wide">{path.title}</h3>
            </MotionDiv>
          ))}
        </div>
      </section>

      {/* ========== TIMELINE ========== */}
      <section id="timeline" className="relative z-10 py-24 px-6 bg-[#070A14] border-y border-white/5">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center text-white uppercase tracking-tight mb-20">
            Competition <span className="text-[#00f0ff]">Timeline</span>
          </h2>
          
          <div className="relative border-l-2 border-white/10 ml-4 md:mx-auto md:border-l-0">
            {/* Center line for desktop */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/10 -translate-x-1/2"></div>
            
            {[
              { date: "22 Feb - 07 Mar 2026", title: "Registration & Submission", desc: "Pendaftaran tim secara online dan pengumpulan karya via Github & Vercel." },
              { date: "08 Mar - 16 Mar 2026", title: "Selection Phase", desc: "Penilaian UI/UX dan source code oleh dewan juri." },
              { date: "17 Mar 2026", title: "Finalist Announcement & TM", desc: "Pengumuman 5 tim terbaik dan Technical Meeting via Zoom." },
              { date: "11 Apr 2026", title: "Final Presentation", desc: "Presentasi akhir tatap muka di UAJY Yogyakarta." }
            ].map((item, i) => (
              <div key={i} className={`relative flex items-center justify-between mb-12 md:justify-normal ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Timeline Dot */}
                <div className="absolute left-[-29px] md:left-1/2 w-6 h-6 rounded-full bg-[#050814] border-4 border-[#00f0ff] md:-translate-x-1/2 z-10 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                
                {/* Content Box */}
                <div className={`w-full pl-8 md:pl-0 md:w-[calc(50%-3rem)] ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                  <div className="bg-[#0a0d1a] border border-white/10 p-6 rounded-xl hover:border-[#00f0ff]/50 transition-colors">
                    <span className="text-[#00f0ff] font-bold text-sm mb-2 block tracking-wider uppercase">{item.date}</span>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRIZEPOOL ========== */}
      <section className="relative z-10 py-24 px-6 max-w-[1000px] mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-20">
          The <span className="text-[#00f0ff]">Prizepool</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Juara 2 */}
          <div className="order-2 md:order-1 bg-[#0a0d1a] border border-white/10 p-8 rounded-t-xl border-t-4 border-t-slate-400">
            <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-4">2nd Place</h4>
            <p className="text-3xl font-black text-white mb-2">Rp 1.000.000</p>
            <p className="text-sm text-slate-500">+ Trophy & Certificate</p>
          </div>
          {/* Juara 1 */}
          <div className="order-1 md:order-2 bg-gradient-to-t from-[#0a0d1a] to-[#00f0ff]/10 border border-[#00f0ff]/30 p-10 rounded-t-xl border-t-4 border-t-[#00f0ff] transform md:-translate-y-8 shadow-[0_0_30px_rgba(0,240,255,0.15)] relative">
            <Trophy className="w-12 h-12 text-[#00f0ff] mx-auto mb-4 absolute top-[-24px] left-1/2 -translate-x-1/2 bg-[#050814] p-2 box-content rounded-full" />
            <h4 className="text-2xl font-black text-[#00f0ff] uppercase tracking-widest mb-4 mt-4">1st Place</h4>
            <p className="text-4xl font-black text-white mb-2">Rp 2.000.000</p>
            <p className="text-sm text-slate-400">+ Trophy & Certificate</p>
          </div>
          {/* Juara 3 */}
          <div className="order-3 md:order-3 bg-[#0a0d1a] border border-white/10 p-8 rounded-t-xl border-t-4 border-t-amber-700">
            <h4 className="text-xl font-black text-amber-600 uppercase tracking-widest mb-4">3rd Place</h4>
            <p className="text-3xl font-black text-white mb-2">Rp 500.000</p>
            <p className="text-sm text-slate-500">+ Trophy & Certificate</p>
          </div>
        </div>
      </section>

      {/* ========== REGISTER BEFORE (COUNTDOWN) ========== */}
      <section className="relative z-10 py-24 px-6 bg-[#070A14] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-12">
            Register <span className="text-[#00f0ff]">Before</span>
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-white">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="flex flex-col items-center">
                <div className="w-20 h-24 md:w-32 md:h-36 bg-[#0a0d1a] border border-[#00f0ff]/30 flex items-center justify-center text-4xl md:text-6xl font-black font-mono rounded-xl shadow-inner shadow-black">
                  {String(value).padStart(2, '0')}
                </div>
                <span className="text-xs md:text-sm text-[#00f0ff] font-bold uppercase tracking-widest mt-4">{unit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SPONSORED BY (Organized By) ========== */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-[0.3em] mb-8">Organized By</h2>
          <div className="flex flex-wrap justify-center gap-12 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-2xl font-black text-white tracking-widest flex items-center gap-2"><Hexagon className="w-8 h-8" /> IFEST #14</div>
            <div className="text-xl font-bold text-white">UNIVERSITAS ATMA JAYA</div>
            <div className="text-xl font-black text-white italic">WDC 2026</div>
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section id="faq" className="relative z-10 py-24 px-6 bg-[#070A14]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center text-white uppercase tracking-tight mb-16">
            Frequently Asked <span className="text-[#00f0ff]">Questions</span>
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#0a0d1a] border border-white/10 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none cursor-pointer"
                >
                  <span className={`font-bold text-lg transition-colors ${activeFaq === i ? 'text-[#00f0ff]' : 'text-white'}`}>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${activeFaq === i ? 'rotate-180 text-[#00f0ff]' : 'text-slate-500'}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="text-slate-400 px-6 pb-6 leading-relaxed">{faq.a}</p>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA BOTTOM ========== */}
      <section className="relative z-10 py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-10 leading-tight">
            READY TO TAKE THE<br/>CHALLENGE?
          </h2>
          <button onClick={onStart} className="px-12 py-5 bg-white text-[#050814] hover:bg-[#00f0ff] font-black text-xl uppercase tracking-widest rounded-lg transition-colors cursor-pointer inline-flex items-center gap-3">
            Register Team <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="relative z-10 bg-[#020308] py-12 px-6 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-widest text-white uppercase italic">
              STU<span className="text-[#00f0ff]">PROD</span>
            </span>
          </div>
          <div className="text-slate-600 text-sm font-medium text-center md:text-left">
            &copy; 2026 StuProd for WDC IFest #14. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-bold tracking-widest text-slate-500 uppercase">
            <a href="#" className="hover:text-[#00f0ff] transition-colors">Instagram</a>
            <a href="#" className="hover:text-[#00f0ff] transition-colors">Github</a>
          </div>
        </div>
      </footer>

    </div>
  );
}