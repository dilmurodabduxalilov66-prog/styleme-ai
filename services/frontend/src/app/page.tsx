import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import AIDemoSlider from '@/components/landing/AIDemoSlider';
import FAQAccordion from '@/components/landing/FAQAccordion';
import { 
  AlertTriangle, 
  Clock, 
  MessageSquareX, 
  Scan, 
  Sparkles, 
  CalendarCheck, 
  MapPin, 
  Award, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  ChevronRight,
  Star
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col text-text-primary selection:bg-primary selection:text-white bg-transparent">
      {/* Header Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* ============================================================================
            1. HERO SECTION
           ============================================================================ */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-32 lg:pb-40">
          {/* Cyber Amethyst Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/25 blur-[100px] mix-blend-screen pointer-events-none"></div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Copywriting Column */}
              <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI-Powered Styling & Booking</span>
                </div>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-text-primary">
                  Yuz shaklingizga mos <br />
                  <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                    mukammal soch turmagini
                  </span> <br />
                  AI yordamida kashf eting
                </h1>
                <p className="font-sans text-base sm:text-lg text-text-muted max-w-2xl mx-auto lg:mx-0">
                  StyleMe AI yuzingiz geometriyasini soniyalar ichida tahlil qiladi va eng mos soch turmaklarini 3D formatda sinab ko'rish imkonini beradi. Sartaroshga tavakkal bormang.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/tryon"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-6 h-12 text-base font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95"
                  >
                    <span>Kamerani Oching (Skanerlash)</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="flex w-full sm:w-auto items-center justify-center rounded-md bg-surface border border-border-glass hover:bg-border-base px-6 h-12 text-base font-semibold text-text-primary transition-colors duration-150"
                  >
                    Kataloglarni Ko'rish
                  </a>
                </div>
                <p className="text-xs text-text-muted">
                  Skanerlash bepul • Rasm saqlanmaydi va 24 soatdan so'ng butunlay o'chiriladi.
                </p>
              </div>

              {/* Mockup Preview Column */}
              <div className="lg:col-span-5 flex justify-center relative">
                {/* Secondary ambient glow behind phone */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] rounded-full bg-primary/30 blur-[80px] pointer-events-none"></div>
                <div className="hover-3d-tilt relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/18] rounded-[40px] border-[8px] border-white/10 glass-panel shadow-glow-purple overflow-hidden">
                  {/* Viewfinder simulation */}
                  <img 
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400&h=800"
                    alt="Smartphone App Tryon Preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                  {/* Mesh Overlay */}
                  <div className="absolute inset-0 border border-primary/30 bg-gradient-to-t from-primary/30 via-transparent to-transparent flex flex-col justify-end p-5">
                    <div className="glass-panel p-4 rounded-xl border border-white/20 shadow-premium backdrop-blur-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-muted">Yuz shakli:</span>
                        <span className="text-primary font-bold">OVAL</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-muted">Moslik darajasi:</span>
                        <span className="text-success font-semibold">98% Match</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================
            2. PROBLEM SECTION
           ============================================================================ */}
        <section id="problem" className="py-20 bg-surface/30 border-y border-border-glass relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">Muammo</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                Nega sartaroshga borish doim tavakkalchilik?
              </h2>
              <p className="font-sans text-sm sm:text-base text-text-muted">
                Kiyimlarni kiyib ko'ramiz, lekin soch turmagini-chi? Odamlarning 70% dan ortig'i soch kesish natijasidan to'liq qoniqmaydi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {/* Problem 1 */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary">Mos kelmaydigan uslub</h3>
                <p className="font-sans text-sm text-text-muted leading-relaxed">
                  Yuz tuzilishingiz va soch turiga mos kelmaydigan soch turmagini tanlash. Natijada esa oylab kutishga majbur qiladigan xato.
                </p>
              </div>

              {/* Problem 2 */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
                  <MessageSquareX className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary">Tushunmovchilik muammosi</h3>
                <p className="font-sans text-sm text-text-muted leading-relaxed">
                  Sartaroshga o'zingiz xohlagan uslubni tushuntira olmaslik va eski rasmlarni izlash chalkashligi.
                </p>
              </div>

              {/* Problem 3 */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-text-muted/10 text-text-muted flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary">Vaqt yo'qotish</h3>
                <p className="font-sans text-sm text-text-muted leading-relaxed">
                  Sartaroshxonada soatlab navbat kutish, band qilingan vaqtlar chalkashib ketishi yoki chalkash taqvimlar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================
            3. SOLUTION SECTION
           ============================================================================ */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">Yechim</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                StyleMe AI qanday ishlaydi?
              </h2>
              <p className="font-sans text-sm sm:text-base text-text-muted">
                Soch turmagini tanlashdan boshlab, uni usta yordamida haqiqatga aylantirishgacha bo'lgan raqamli zanjir.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                  <Scan className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary">01. Tezkor AI Skanerlash</h3>
                <p className="font-sans text-sm text-text-muted max-w-xs leading-relaxed">
                  Selfi yuklang va kamerani oching. AI soniyalar ichida yuzingiz tuzilishi va bosh geometriyasini aniqlaydi.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary">02. 3D Realistik Try-On</h3>
                <p className="font-sans text-sm text-text-muted max-w-xs leading-relaxed">
                  Tavsiya etilgan o'nlab soch turmaklarini o'z yuzingizda 3D formatda sinab ko'ring, ranglar va uslublarni o'zgartiring.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary">03. 1-Klikda Band Qilish</h3>
                <p className="font-sans text-sm text-text-muted max-w-xs leading-relaxed">
                  Siz tanlagan turmakni aynan o'sha uslubda kesa oladigan eng yaqin tasdiqlangan sartaroshni toping va navbatsiz band qiling.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================
            4. AI DEMO SECTION
           ============================================================================ */}
        <section id="ai-demo" className="py-20 bg-surface/20 border-y border-border-glass relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Info Column */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <span className="text-xs font-bold tracking-wider text-primary uppercase">Interaktiv Sinov</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                  AI Sifatiga O'zingiz Baho Bering
                </h2>
                <p className="font-sans text-sm sm:text-base text-text-muted leading-relaxed">
                  Generativ neyron tarmoqlarimiz soch chegaralarini, rang o'tishlarini va bosh shaklini hisobga olgan holda mutlaqo realistik 3D renderlar taqdim etadi. O'ngga suring va natijani solishtiring!
                </p>
                <div className="flex justify-center lg:justify-start pt-2">
                  <Link
                    href="/tryon"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-6 h-12 text-sm font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>O'zingizda Sinab Ko'ring (Tekshin)</span>
                  </Link>
                </div>
              </div>

              {/* Interactive Widget Column */}
              <div className="lg:col-span-6 flex justify-center w-full">
                <AIDemoSlider />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================
            5. BARBER MARKETPLACE SECTION
           ============================================================================ */}
        <section id="marketplace" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Map/Graphics Column */}
              <div className="lg:col-span-6 flex justify-center order-last lg:order-first">
                <div className="relative w-full max-w-md aspect-square rounded-2xl border border-border-glass bg-surface/50 overflow-hidden p-6 flex flex-col justify-between shadow-premium">
                  {/* Stylized dark map container */}
                  <div className="absolute inset-0 bg-canvas/80 opacity-40 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  
                  {/* Glowing Pins */}
                  <div className="absolute top-[30%] left-[40%] animate-bounce">
                    <div className="relative">
                      <MapPin className="h-8 w-8 text-primary filter drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success text-[8px] font-bold text-white">S</span>
                    </div>
                  </div>
                  
                  <div className="absolute top-[60%] left-[70%] animate-bounce [animation-delay:0.3s]">
                    <MapPin className="h-8 w-8 text-primary filter drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  </div>

                  <div className="relative z-10 space-y-4">
                    <span className="text-xs font-semibold text-primary">YUNUSOBOD TUMANI</span>
                    <h4 className="font-display text-lg font-bold text-text-primary">Elite Barbershop</h4>
                    <p className="text-xs text-text-muted">3 ta tasdiqlangan master hozir faol</p>
                  </div>

                  <div className="relative z-10 glass-panel p-3 rounded-xl border border-border-glass flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-border-base bg-[url('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100')] bg-cover"></div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary">Elyor Karimov</h5>
                        <p className="text-[10px] text-text-muted">Taper Fade bo'yicha usta</p>
                      </div>
                    </div>
                    <Link href="/barbers" className="text-[10px] text-primary font-bold hover:underline">
                      Band qilish
                    </Link>
                  </div>
                </div>
              </div>

              {/* Copywriting Column */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <span className="text-xs font-bold tracking-wider text-primary uppercase">Sartaroshxonalar tarmog'i</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                  Sizga eng yaqin, tasdiqlangan salonlar
                </h2>
                <p className="font-sans text-sm sm:text-base text-text-muted leading-relaxed">
                  Siz tanlagan yangi soch turmagini aynan o'sha darajada qila oladigan, sertifikatlangan sartaroshlarni xaritadan toping. Har bir ustaning ishlari portfoliosi va mijoz sharhlari blockchain-dek xavfsiz va tekshirilgan.
                </p>
                <div className="pt-2">
                  <Link
                    href="/barbers"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover group"
                  >
                    <span>Yaqin atrofdagi salonlarni ko'rish</span>
                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================
            6. RANKING SYSTEM SECTION
           ============================================================================ */}
        <section id="ranking" className="py-20 bg-surface/30 border-y border-border-glass relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Copywriting Column */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <span className="text-xs font-bold tracking-wider text-primary uppercase">Sifat Kafolati</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                  Faqat eng sara ustalar: S-Rank Cheklovi
                </h2>
                <p className="font-sans text-sm sm:text-base text-text-muted leading-relaxed">
                  Bizning platformamizda sartaroshlar reytingi mijozlarning qayta kelishi va xizmat sifati ko'rsatkichlari asosida avtomatik hisoblanadi. Har bir hududda ustalar faqatgina 5 foizigacha S-Rank darajasiga ko'tarila oladi. Bu sizga premium darajada xizmat ko'rsatilishini kafolatlaydi.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2 max-w-sm mx-auto lg:mx-0">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-xs text-text-muted">S-Rank: Top 5% ustalar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-success" />
                    <span className="text-xs text-text-muted">Kafolatlangan sifat</span>
                  </div>
                </div>
              </div>

              {/* Visual Badges Column */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="space-y-4 w-full max-w-md">
                  {/* S-Rank Card */}
                  <div className="glass-panel p-4 rounded-xl border border-primary/30 flex items-center justify-between shadow-glow-purple">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-bold">S</div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">S-Rank (Elite Master)</h4>
                        <p className="text-[11px] text-text-muted">Komissiya stavkasi: 5%</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Top 5%</span>
                  </div>

                  {/* A-Rank Card */}
                  <div className="glass-panel p-4 rounded-xl border border-border-glass flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-success/20 text-success flex items-center justify-center font-display font-bold">A</div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">A-Rank (Professional)</h4>
                        <p className="text-[11px] text-text-muted">Komissiya stavkasi: 7%</p>
                      </div>
                    </div>
                  </div>

                  {/* B-Rank Card */}
                  <div className="glass-panel p-4 rounded-xl border border-border-glass flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-text-muted/20 text-text-muted flex items-center justify-center font-display font-bold">B</div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">B-Rank (Tajribali)</h4>
                        <p className="text-[11px] text-text-muted">Komissiya stavkasi: 9%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================
            7. TESTIMONIALS SECTION
           ============================================================================ */}
        <section id="testimonials" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">Sharhlar</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                Foydalanuvchilarimiz nima deydi?
              </h2>
              <p className="font-sans text-sm sm:text-base text-text-muted">
                Bizning neyron tarmoq va sartaroshlarimiz haqida mijozlarning fikri.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              {/* Review 1 */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <p className="font-sans text-sm text-text-muted italic leading-relaxed">
                  "AI menga krop-feyd turmagini tavsiya qildi, boshida shubhalangandim. Lekin try-on rasmini olib sartaroshga bordim, natija rasmdagidek bir xil chiqdi! Uchrashuvni platforma orqali navbatsiz band qilganim ham juda qulay bo'ldi."
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <div className="h-10 w-10 rounded-full bg-border-base bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100')] bg-cover"></div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Sardor A.</h4>
                    <p className="text-[10px] text-text-muted">Mijoz (Tashkent)</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 text-warning">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-warning" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review 2 */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <p className="font-sans text-sm text-text-muted italic leading-relaxed">
                  "StyleMe AI ga usta sifatida qo'shilganimdan beri mijozlarim oqimi 40% ga oshdi. Endi navbatlar chalkashib ketishi deyarli kuzatilmaydi. Eng yaxshi tomoni esa - mijozlar o'zlariga mos soch turmagi rasmi bilan kelishadi."
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <div className="h-10 w-10 rounded-full bg-border-base bg-[url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100')] bg-cover"></div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Elyor K.</h4>
                    <p className="text-[10px] text-text-muted">S-Rank Master (Salon BarberRoom)</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 text-warning">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-warning" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================
            8. FAQ SECTION
           ============================================================================ */}
        <section id="faq" className="py-20 bg-surface/20 border-t border-border-glass">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">Ko'p So'raladiganlar</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                Tez-tez so'raladigan savollar
              </h2>
            </div>
            <FAQAccordion />
          </div>
        </section>

        {/* ============================================================================
            9. CTA SECTION
           ============================================================================ */}
        <section id="cta" className="py-20 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[130px] pointer-events-none"></div>

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="glass-panel p-8 sm:p-12 md:p-16 rounded-3xl border border-primary/30 text-center space-y-6 shadow-glow-purple">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary leading-tight">
                Yangi ko'rinishingizni bugunoq kashf eting
              </h2>
              <p className="font-sans text-sm sm:text-base text-text-muted max-w-2xl mx-auto">
                Tavakkal qilishni bas qiling. Shunchaki yuzingizni skanerlang, soch ko'rinishingizni taqqoslang va bir necha bosqichda usta vaqtini band qiling. Mutlaqo bepul.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/tryon"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-8 h-12 text-base font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Skanerlashni Boshlang (Bepul)</span>
                </Link>
                <Link
                  href="/signup?role=BARBER"
                  className="flex w-full sm:w-auto items-center justify-center rounded-md bg-surface border border-border-glass hover:bg-border-base px-8 h-12 text-base font-semibold text-text-primary transition-colors duration-150"
                >
                  Sartarosh Sifatida Ro'yxatdan O'tish
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer System */}
      <footer className="bg-canvas border-t border-border-glass py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="font-display text-sm font-bold text-text-primary">StyleMe AI</p>
          <p className="text-xs text-text-muted leading-relaxed">
            © {new Date().getFullYear()} StyleMe AI Platform. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Action Bar */}
      <MobileNav />
    </div>
  );
}
