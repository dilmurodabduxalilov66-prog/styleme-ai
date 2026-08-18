'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, 
  Upload, 
  Video, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeftRight, 
  Check, 
  Heart,
  ChevronRight,
  X,
  Share2,
  Columns,
  Eye,
  Sliders,
  Download,
  Star,
  MapPin,
  Calendar,
  Send
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

type ScannerState = 'IDLE' | 'CAMERA' | 'SCANNING' | 'RESULTS';
type CompareMode = 'split' | 'side-by-side' | 'opacity';

interface RecommendedStyle {
  hairstyle_id: number;
  name: string;
  match_score: number;
}

interface Particle {
  id: number;
  tx: number;
  ty: number;
}

export default function AIScannerPage() {
  const router = useRouter();

  const [state, setState] = useState<ScannerState>('IDLE');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // WebRTC States
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Analysis result states
  const [analysisId, setAnalysisId] = useState('');
  const [faceShape, setFaceShape] = useState('');
  const [recommendedStyles, setRecommendedStyles] = useState<RecommendedStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedStyleImage, setSelectedStyleImage] = useState<string | null>(null);

  // Style generation states (Style Switching)
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [styleProgress, setStyleProgress] = useState(0);
  const [styleLogs, setStyleLogs] = useState<string[]>([]);

  // Interactive slider compare states
  const [compareMode, setCompareMode] = useState<CompareMode>('split');
  const [sliderPos, setSliderPos] = useState(50);
  const [opacityVal, setOpacityVal] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // UI States & Heartburst animation
  const [isFavorited, setIsFavorited] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sharing Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Booking details state
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [recommendedBarber, setRecommendedBarber] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Drag & drop file states
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // StyleMe AI Pro states
  const [isPro, setIsPro] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly'|'yearly'>('yearly');

  useEffect(() => {
    // Fetch real Pro status
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (res.data) {
          setIsPro(res.data.is_pro === true);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch nearby barbers when entering RESULTS state
  useEffect(() => {
    if (state === 'RESULTS') {
      const fetchBarbers = async () => {
        try {
          const res = await api.get('/bookings/nearby?lat=41.311081&lng=69.240562&radius=10');
          if (res.data && res.data.length > 0) {
            const barber = res.data[0];
            setRecommendedBarber(barber);
            
            // Fetch real available slots
            const today = new Date().toISOString().split('T')[0];
            try {
              const slotsRes = await api.get(`/barbers/availability/${barber.id}/slots?date=${today}`);
              if (slotsRes.data && slotsRes.data.available_slots) {
                setAvailableSlots(slotsRes.data.available_slots);
              }
            } catch (slotsErr) {
              console.error('Failed to fetch slots', slotsErr);
            }
          }
        } catch (err) {
          console.error('Failed to fetch nearby barbers', err);
        }
      };
      fetchBarbers();
    }
  }, [state]);

  // Start webRTC camera stream
  const startCamera = async () => {
    setCameraError(null);
    setErrorMsg(null);
    setState('CAMERA');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera capture access denied:', err);
      setCameraError("Kameraga kirish rad etildi. Iltimos, brauzer sozlamalaridan kameraga ruxsat bering.");
      setState('IDLE');
    }
  };

  // Stop WebRTC stream
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Capture frame from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoBlob(blob);
          setPhotoUrl(URL.createObjectURL(blob));
          stopCamera();
          triggerAnalysis(blob);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Trigger analysis call on image file
  const triggerAnalysis = async (fileBlob: Blob) => {
    setState('SCANNING');
    setScanProgress(10);
    setErrorMsg(null);
    setTelemetryLogs(["[0.0s] Tahlil uchun so'rov yuborildi..."]);

    const formData = new FormData();
    formData.append('image', fileBlob, 'selfie.jpg');

    try {
      // API call to python FastAPI ai-service
      const { data } = await api.post('/ai/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setScanProgress(100);
      setTelemetryLogs((prev) => [...prev, "[OK] Tahlil muvaffaqiyatli yakunlandi."]);
      
      setAnalysisId(data.analysis_id);
      setFaceShape(data.face_shape);
      setRecommendedStyles(data.recommended_styles);
      if (data.recommended_styles?.length > 0) {
        const firstStyle = data.recommended_styles[0];
        setSelectedStyle(firstStyle.name);
        setSelectedStyleImage(null); // No fallback image, user must press Generate
        
        setState('RESULTS');
        
        // Auto-generate for Pro users
        if (isPro) {
          generateStyleLook(firstStyle?.hairstyle_id || (recommendedStyles[0] as any)?.id, firstStyle.name, data.analysis_id);
        }
      } else {
        setState('RESULTS');
      }
    } catch (err: any) {
      console.error('AI Analysis Error:', err);
      setState('IDLE');
      if (err.response?.status === 422) {
        setErrorMsg("Yuz aniqlanmadi. Iltimos, kameraga to'g'ri qarab, yorug'roq joyda qaytadan rasmga tushiring.");
      } else if (err.response?.data?.detail && typeof err.response.data.detail === 'string') {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg("AI xizmatiga ulanishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      }
    }
  };

  // Trigger Style Switching Generation
  const generateStyleLook = async (styleId: number, styleName: string, overrideAnalysisId?: string) => {
    if (isGeneratingStyle) return;
    setIsGeneratingStyle(true);
    setStyleProgress(15);
    setSelectedStyle(styleName);
    setStyleLogs(["[0.0s] Generatsiya boshlandi, server javobi kutilmoqda..."]);

    try {
      const { data } = await api.post('/ai/tryon', {
        analysis_id: overrideAnalysisId || analysisId,
        hairstyle_id: styleId,
      });

      setStyleProgress(100);
      setStyleLogs((prev) => [...prev, "[OK] AI modeli rasmni taqdim etdi."]);
      if (data.result_image_url) {
        setSelectedStyleImage(data.result_image_url);
      } else {
        setErrorMsg("Xatolik: Real generated image olinmadi. Replicate yoki R2 da muammo bo'lishi mumkin.");
        setSelectedStyleImage(null);
      }
    } catch (err: any) {
      console.error('AI Tryon API Error:', err);
      if (err.response?.status === 403) {
        setIsSubscriptionModalOpen(true);
      } else {
        setErrorMsg("Generatsiya jarayonida xatolik yuz berdi. Iltimos qaytadan urinib ko'ring yoki kreditni tekshiring.");
      }
      setSelectedStyleImage(null);
    } finally {
      setStyleProgress(0);
      setIsGeneratingStyle(false);
    }
  };



  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              setPhotoBlob(blob);
              setPhotoUrl(URL.createObjectURL(blob));
              triggerAnalysis(blob);
            }
          }, 'image/jpeg', 0.9);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag & drop file handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  // Before/after split slider logic
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingSlider) return;
    handleSliderMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDraggingSlider(false);
  };

  useEffect(() => {
    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSlider]);

  // Clean WebRTC streams on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Heartburst Animation handler
  const handleFavoriteClick = () => {
    const nextFavorite = !isFavorited;
    setIsFavorited(nextFavorite);
    if (nextFavorite) {
      // Trigger haptics if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
      // Generate 12 star particles
      const newParticles = Array.from({ length: 12 }).map((_, i) => {
        const angle = ((i * 360) / 12) * (Math.PI / 180);
        const dist = 40 + Math.random() * 50;
        return {
          id: Math.random(),
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist,
        };
      });
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 700);
    }
  };

  // Submit Booking transaction
  const handleBookingConfirm = async () => {
    if (!selectedSlot || !recommendedBarber) return;
    setBookingSuccess(true);
    try {
      // Simple parse of the time for today's date
      const today = new Date();
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      const endTime = new Date(startTime.getTime() + 30 * 60000); // add 30 mins

      await api.post('/bookings/create', {
        barber_id: recommendedBarber.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        payment_method: 'CASH',
      });

      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedSlot(null);
        router.push('/ticket');
      }, 2500);
    } catch (err) {
      console.error('Booking failed', err);
      setBookingSuccess(false);
      setErrorMsg("Band qilishda xatolik yuz berdi. Balki vaqt allaqachon band qilingan.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 text-text-primary">
      {/* Dynamic Keyframe style inject for particles */}
      <style>{`
        @keyframes particleFly {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>

      {/* 1. IDLE / FILE UPLOAD STATE */}
      {state === 'IDLE' && (
        <div className="space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-text-primary bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
              AI Skanerlash & Soch Sinash
            </h1>
            <p className="font-sans text-sm text-text-muted">
              Yuz shaklingizni aniqlash va mos soch turmaklarini sinash uchun selfi yuklang yoki kamerani oching.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 p-4 text-sm font-semibold text-danger max-w-lg mx-auto">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cameraError && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 p-4 text-sm font-semibold text-warning max-w-lg mx-auto">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Drag & drop file upload card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "w-full max-w-lg mx-auto aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center gap-4 p-8 transition-all duration-300 select-none cursor-pointer group glass-panel",
              isDraggingFile 
                ? "border-primary bg-primary/10 shadow-glow-purple scale-[1.02]" 
                : "border-border-glass border-dashed hover:border-primary/50 hover:shadow-glow-purple"
            )}
          >
            <input
              type="file"
              id="file-upload"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="flex flex-col items-center gap-4 cursor-pointer text-center">
              <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <span className="font-semibold text-text-primary text-sm">Rasm sudrab yuklang (Drag & Drop)</span>
                <p className="text-xs text-text-muted mt-1">PNG, JPG, JPEG fayllari (maksimal 5 MB)</p>
              </div>
            </label>
            <span className="text-xs text-text-muted">yoki</span>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-5 h-10 text-xs font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95"
            >
              <Video className="h-4 w-4" />
              <span>Kamerani Oching</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. WEBRTC VIEWVIEWFINDER CAMERA STATE */}
      {state === 'CAMERA' && (
        <div className="space-y-6 flex flex-col items-center">
          <div className="text-center max-w-xs space-y-1">
            <h2 className="font-display text-lg font-bold text-text-primary">Yuzingizni joylashtiring</h2>
            <p className="font-sans text-xs text-text-muted">Kamera oyna chizig'iga boshingizni to'g'rilang</p>
          </div>

          {/* Viewfinder Canvas Stencil */}
          <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden border border-border-glass bg-black shadow-premium">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            {/* Oval Face Guide Overlay */}
            <div className="absolute inset-0 border-[6px] border-canvas/80 flex items-center justify-center">
              <div className="w-[70%] h-[75%] rounded-[150px/200px] border-2 border-dashed border-primary shadow-[0_0_0_9999px_rgba(3,3,3,0.5)]"></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                stopCamera();
                setState('IDLE');
              }}
              className="flex items-center justify-center rounded-md bg-surface border border-border-glass px-5 h-10 text-xs font-semibold text-text-primary transition-colors"
            >
              Bekor Qilish
            </button>
            <button
              onClick={capturePhoto}
              className="flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-6 h-10 text-xs font-semibold text-white shadow-glow-purple transition-all active:scale-95"
            >
              <Camera className="h-4 w-4" />
              <span>Suratga Tushish</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. BIOMETRIC GRID SCAN / PROGRESS STATE */}
      {state === 'SCANNING' && (
        <div className="space-y-6 flex flex-col items-center">
          <div className="text-center space-y-1">
            <h2 className="font-display text-lg font-bold text-text-primary">AI Tahlil Bajarilmoqda...</h2>
            <p className="font-sans text-xs text-text-muted">Yuz geometriyasini tahlil qilish (Landmarks Extraction)</p>
          </div>

          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border border-border-glass bg-surface/50 shadow-premium">
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Captured Portrait"
                className="w-full h-full object-cover filter grayscale"
              />
            )}
            {/* Holographic sweeping laser scan line */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_20px_4px_rgba(139,92,246,0.8)] animate-scan z-10"
              ></div>
              <div 
                className="absolute left-0 right-0 h-32 bg-gradient-to-b from-primary/30 to-transparent animate-scan z-0 -mt-32"
              ></div>
            </div>
          </div>

          {/* Telemetry scrolling logs terminal */}
          <div className="w-full max-w-sm rounded-lg border border-border-glass bg-black p-4 font-mono text-[10px] text-text-muted space-y-1 h-28 overflow-y-auto">
            {telemetryLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-1.5 animate-fade-in text-primary">
                <Check className="h-3 w-3 shrink-0" />
                <span>{log}</span>
              </div>
            ))}
          </div>

          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-xs text-text-muted font-semibold">
              <span>Jarayon:</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-border-base rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESULTS / BEFORE AFTER PREVIEW COMPARISON STATE */}
      {state === 'RESULTS' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Dashboard section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border-glass">
            <div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Tahlil Yakunlandi
              </span>
              <h2 className="font-display text-xl sm:text-3xl font-bold text-text-primary mt-2 flex items-center gap-2">
                Sizning yuz shaklingiz: <span className="text-primary uppercase bg-primary/5 px-2.5 py-0.5 rounded border border-primary/20">{faceShape || 'OVAL'}</span>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-1">
                Tavsiya etilgan soch turmaklarini quyidagi taqqoslash vositalari orqali ko'zdan kechiring.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setPhotoBlob(null);
                  setPhotoUrl(null);
                  setCameraError(null);
                  setErrorMsg(null);
                  setState('IDLE');
                }}
                className="flex items-center gap-2 rounded-md bg-surface border border-border-glass hover:bg-border-base px-4 h-9 text-xs font-semibold text-text-primary transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Qayta skanerlash</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side: Interactive comparison layout box */}
            <div className="lg:col-span-7 space-y-4">
              {/* Compare Mode Selector Controls */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface/50 border border-border-glass w-fit">
                <button
                  onClick={() => setCompareMode('split')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    compareMode === 'split' ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>Split Slayder</span>
                </button>
                <button
                  onClick={() => setCompareMode('side-by-side')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    compareMode === 'side-by-side' ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span>Side-by-Side</span>
                </button>
                <button
                  onClick={() => setCompareMode('opacity')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    compareMode === 'opacity' ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Shaffoflik</span>
                </button>
              </div>

              {/* Loader overlay inside comparison box for new style generations */}
              <div className="relative w-full aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden border border-border-glass bg-surface shadow-premium select-none">
                {isGeneratingStyle && (
                  <div className="absolute inset-0 bg-black/85 z-30 flex flex-col items-center justify-center p-6 gap-4 animate-fade-in">
                    {/* Generative Spinner Circle */}
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <div 
                        className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"
                        style={{ animationDuration: '1.2s' }}
                      ></div>
                      <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                    </div>

                    <div className="text-center space-y-1">
                      <h4 className="font-display text-sm font-bold text-white">Ko'rinish generatsiya qilinmoqda</h4>
                      <p className="text-[10px] text-text-muted">Stable Diffusion AI model yuklanmoqda...</p>
                    </div>

                    {/* Mini log terminal inside loading screen */}
                    <div className="w-full max-w-xs rounded border border-border-glass bg-black/60 p-3 font-mono text-[9px] text-text-muted space-y-1 h-20 overflow-y-auto">
                      {styleLogs.map((log, index) => (
                        <div key={index} className="flex items-center gap-1 text-primary animate-fade-in">
                          <Check className="h-2.5 w-2.5 shrink-0" />
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>

                    <div className="w-full max-w-xs space-y-1">
                      <div className="flex justify-between text-[10px] text-text-muted">
                        <span>Generatsiya jarayoni:</span>
                        <span>{styleProgress}%</span>
                      </div>
                      <div className="h-1 w-full bg-border-base rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${styleProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4A. SPLIT SLIDER COMPARISON VIEW */}
                {compareMode === 'split' && (
                  <div 
                    ref={sliderContainerRef}
                    className="relative w-full h-full cursor-ew-resize"
                    onMouseDown={() => setIsDraggingSlider(true)}
                    onTouchStart={() => setIsDraggingSlider(true)}
                  >
                    {/* Original selfie */}
                    {photoUrl && (
                      <img
                        src={photoUrl}
                        alt="Original Selfie"
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable="false"
                      />
                    )}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-semibold border border-border-glass text-white">
                      Hozirgi holat
                    </div>

                    {/* Styled simulation overlay */}
                    <div 
                      className="absolute inset-0 w-full h-full overflow-hidden"
                      style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
                    >
                      {selectedStyleImage ? (
                        <img
                          src={selectedStyleImage}
                          alt="Styled output"
                          className="absolute inset-0 w-full h-full object-cover"
                          draggable="false"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm p-6 text-center">
                          <Sparkles className="h-10 w-10 text-primary mb-3 opacity-50" />
                          <p className="text-white text-sm font-semibold">Uslubni ko'rish uchun "Shu ko'rinishni generatsiya qilish" tugmasini bosing</p>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-primary/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-semibold border border-primary-glow flex items-center gap-1 text-white">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>{selectedStyle || 'Fade Style'}</span>
                      </div>
                    </div>

                    {/* Split drag handler bar */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white border-2 border-white shadow-glow-purple pointer-events-auto cursor-grab active:cursor-grabbing">
                        <ArrowLeftRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4B. SIDE BY SIDE COMPARISON VIEW */}
                {compareMode === 'side-by-side' && (
                  <div className="grid grid-cols-2 h-full w-full">
                    <div className="relative border-r border-border-glass h-full">
                      {photoUrl && (
                        <img
                          src={photoUrl}
                          alt="Before"
                          className="w-full h-full object-cover"
                          draggable="false"
                        />
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-medium border border-border-glass text-white">
                        Avval
                      </div>
                    </div>
                    <div className="relative h-full">
                      {selectedStyleImage ? (
                        <img
                          src={selectedStyleImage}
                          alt="After"
                          className="w-full h-full object-cover"
                          draggable="false"
                        />
                      ) : (
                        <div className="flex w-full h-full items-center justify-center bg-surface/50 text-center p-4">
                          <p className="text-[10px] text-text-muted">Generatsiya qilinmadi</p>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-primary/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-medium border border-primary-glow text-white">
                        Keyin: {selectedStyle || 'Fade'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4C. OPACITY BLEND VIEW */}
                {compareMode === 'opacity' && (
                  <div className="relative w-full h-full">
                    {photoUrl && (
                      <img
                        src={photoUrl}
                        alt="Original"
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable="false"
                      />
                    )}
                    {selectedStyleImage ? (
                      <img
                        src={selectedStyleImage}
                        alt="Styled Blend"
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-75"
                        style={{ opacity: opacityVal / 100 }}
                        draggable="false"
                      />
                    ) : (
                      <div className="absolute inset-0 flex w-full h-full items-center justify-center bg-surface/50 text-center p-4 z-10" style={{ opacity: opacityVal / 100 }}>
                        <p className="text-[10px] text-text-muted">Generatsiya qilinmadi</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-semibold border border-border-glass text-white">
                      Aralashtirish (Blend)
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 bg-black/65 backdrop-blur-md p-2 rounded-lg border border-border-glass flex items-center gap-3">
                      <Sliders className="h-3.5 w-3.5 text-primary shrink-0" />
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={opacityVal}
                        onChange={(e) => setOpacityVal(Number(e.target.value))}
                        className="flex-1 accent-primary h-1 bg-border-glass rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[9px] font-mono text-white w-6 text-right shrink-0">{opacityVal}%</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-text-muted italic text-center">
                {compareMode === 'split' ? "Slayderni suring va soch mosligini tekshiring" : "Turli taqqoslash rejimlarini yoqing"}
              </p>
            </div>

            {/* Right side: Recommendations list & action blocks */}
            <div className="lg:col-span-5 space-y-6">
              {isPro ? (
                <div className="space-y-6">
                  {/* Pro Best Match Callout */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider">
                      <Star className="h-3 w-3 fill-primary" />
                      <span>StyleMe AI Pro Tanlovi</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-text-primary">
                      AI siz uchun eng mos uslubni tanladi
                    </h3>
                  </div>
                  
                  {recommendedStyles.length > 0 && (
                    <div className="glass-panel p-5 rounded-xl border border-primary/30 shadow-glow-purple relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Sparkles className="h-24 w-24 text-primary" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            {recommendedStyles[0].name}
                          </h4>
                          <span className="text-sm font-bold text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full shrink-0">
                            AI Match: {recommendedStyles[0].match_score ?? "N/A"}%
                          </span>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed mb-4">
                          Yuz shaklingiz ({faceShape || 'aniqlangan yuz proporsiyalari'}) va peshona-yonoq nisbatlaringiz asosida bu hairstyle sizga eng mos variantlardan biri deb topildi.
                        </p>
                        <button
                          onClick={() => generateStyleLook(recommendedStyles[0]?.hairstyle_id || (recommendedStyles[0] as any)?.id, recommendedStyles[0].name)}
                          disabled={isGeneratingStyle}
                          className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-bold py-3 rounded-lg shadow-glow-purple transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Eng mos turmakni yaratish
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pro Grid of All Styles */}
                  <div className="space-y-3 pt-4 border-t border-border-glass">
                    <h3 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider">
                      Barcha Pro Turmaklar ({recommendedStyles.length - 1}+)
                    </h3>
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                      {recommendedStyles.slice(1).map((style) => (
                        <button
                          key={style?.hairstyle_id || (style as any)?.id}
                          onClick={() => generateStyleLook(style?.hairstyle_id || (style as any)?.id, style.name)}
                          disabled={isGeneratingStyle}
                          className={cn(
                            "glass-panel p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all duration-150 relative",
                            selectedStyle === style.name
                              ? "border-primary bg-primary/5 shadow-glow-purple"
                              : "border-border-glass hover:bg-border-glass/30 hover:scale-[1.02]",
                            isGeneratingStyle && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-text-primary leading-tight">
                              {style.name}
                            </h4>
                            {selectedStyle === style.name && <Sparkles className="h-3 w-3 text-primary animate-pulse shrink-0" />}
                          </div>
                          <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-1.5 py-0.5 rounded-md self-start">
                            {style.match_score ?? "N/A"}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {/* ⭐ STYLEME AI BEST MATCH */}
                    <div className="glass-panel p-5 rounded-2xl border-2 border-primary/40 relative overflow-hidden bg-primary/5">
                      <div className="absolute top-0 right-0 bg-primary/20 text-primary px-3 py-1 rounded-bl-lg text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        ⭐ STYLEME AI BEST MATCH
                      </div>
                      
                      <div className="mt-2 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-display text-xl font-black text-text-primary">
                            {recommendedStyles[0].name}
                          </h3>
                          <span className="text-sm font-bold text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full shrink-0">
                            AI Match: {recommendedStyles[0].match_score ?? "N/A"}%
                          </span>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed mb-2">
                          Yuz shaklingiz va peshona-yonoq nisbatlaringiz asosida bu turmak sizga eng mos deb topildi.
                        </p>
                        <button
                          onClick={() => generateStyleLook(recommendedStyles[0]?.hairstyle_id || (recommendedStyles[0] as any)?.id, recommendedStyles[0].name)}
                          disabled={isGeneratingStyle}
                          className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-bold py-3 rounded-lg shadow-glow-purple transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Eng mos turmakni yaratish
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <h3 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider">
                        Boshqa Tavsiyalar
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {recommendedStyles.slice(1, 3).map((style) => (
                        <button
                          key={style?.hairstyle_id || (style as any)?.id}
                          onClick={() => generateStyleLook(style?.hairstyle_id || (style as any)?.id, style.name)}
                          disabled={isGeneratingStyle}
                          className={cn(
                            "w-full glass-panel p-4 rounded-xl border text-left flex items-center justify-between gap-4 transition-all duration-150 relative overflow-hidden",
                            selectedStyle === style.name
                              ? "border-primary bg-primary/5 shadow-glow-purple"
                              : "border-border-glass hover:bg-border-glass/30 hover:scale-[1.01]",
                            isGeneratingStyle && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          <div>
                            <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                              {style.name}
                              {selectedStyle === style.name && <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />}
                            </h4>
                            <p className="text-[10px] text-text-muted mt-1">Yuz shaklingiz uchun mos keladi</p>
                          </div>
                            <span className="text-xs font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-md shrink-0">
                              {style.match_score ?? "N/A"}%
                            </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Premium CTA Box for Free Users */}
                  <div className="mt-6 p-5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-3 items-start relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <Star className="h-24 w-24 text-primary" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                      <Star className="h-3 w-3 fill-primary" />
                      🔒 STYLEME AI PRO
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed max-w-[250px] relative z-10">
                      Unlock 21 additional professional hairstyles
                    </p>
                    <button
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover py-2.5 mt-2 text-sm font-bold text-white shadow-glow-purple transition-all relative z-10"
                    >
                      UPGRADE TO PRO
                    </button>
                  </div>
                </>
              )}

              {/* Action Buttons Panel (Favorites and Share) */}
              <div className="flex gap-3 pt-4 border-t border-border-glass relative">
                {/* Save to Favorites (Heartburst Animation) */}
                <button
                  onClick={handleFavoriteClick}
                  className={cn(
                    "h-11 w-11 rounded-lg border flex items-center justify-center transition-all duration-150 active:scale-95 relative",
                    isFavorited
                      ? "bg-danger/10 border-danger text-danger shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                      : "border-border-glass text-text-muted hover:text-text-primary hover:bg-border-glass"
                  )}
                  aria-label="Save style look"
                >
                  <Heart className={cn("h-5 w-5", isFavorited && "fill-danger")} />
                  {/* Particles Burst Spawner */}
                  {particles.map((p) => (
                    <div
                      key={p.id}
                      className="absolute h-2 w-2 rounded-full bg-danger pointer-events-none"
                      style={{
                        animation: 'particleFly 0.6s ease-out forwards',
                        '--tx': `${p.tx}px`,
                        '--ty': `${p.ty}px`,
                        left: '50%',
                        top: '50%',
                        marginLeft: '-4px',
                        marginTop: '-4px',
                      } as React.CSSProperties}
                    />
                  ))}
                </button>

                {/* Share Look Button */}
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-md border border-border-glass bg-surface hover:bg-border-glass/35 px-4 h-11 text-xs font-semibold text-text-primary transition-all active:scale-95"
                >
                  <Share2 className="h-4 w-4 text-primary" />
                  <span>Ko'rinishni Ulashish</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. BARBER BOOKING SLOTS CHECKOUT PANEL */}
          <div className="glass-panel border border-border-glass rounded-2xl p-6 mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-glass pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Ushbu turmakni kesa oladigan eng yaqin sartarosh</span>
                </h3>
                <p className="text-xs text-text-muted mt-1">Yunusobod tumanidagi S-Klass toifasidagi masterlar</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-muted">Komissiya stavkasi:</span>
                <div className="text-xs font-bold text-success">S-Rank (5% Chegirma)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Barber Profile */}
              <div className="md:col-span-5 flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-border-glass shrink-0 border border-border-glass">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200"
                    alt={recommendedBarber?.full_name || 'Barber'}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {recommendedBarber?.full_name || 'Barber qidirilmoqda...'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center text-warning text-xs">
                      <Star className="h-3.5 w-3.5 fill-warning shrink-0" />
                      <span className="ml-1 font-bold">4.9</span>
                    </div>
                    <span className="text-[10px] text-text-muted">(184 baho)</span>
                    <span className="text-[10px] text-text-muted">•</span>
                    <div className="flex items-center text-[10px] text-text-muted">
                      <MapPin className="h-3 w-3 mr-0.5 shrink-0" />
                      <span>{recommendedBarber?.distance_km ? `${parseFloat(recommendedBarber.distance_km).toFixed(1)} km` : '1.2 km'}</span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-primary mt-1">Xizmat haqi: {recommendedBarber?.price_tier || '60,000 UZS'}</div>
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="md:col-span-4 space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Bugungi bo'sh vaqtlar:</span>
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedSlot(time)}
                        className={cn(
                          "py-2 text-xs font-semibold rounded-md border text-center transition-all",
                          selectedSlot === time
                            ? "border-primary bg-primary text-white"
                            : "border-border-glass hover:bg-border-glass/40 text-text-primary"
                        )}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-4 text-xs text-text-muted text-center py-2 border border-dashed border-border-glass rounded-md">
                      Bo'sh vaqtlar yo'q
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout CTA Trigger */}
              <div className="md:col-span-3">
                <button
                  onClick={handleBookingConfirm}
                  disabled={!selectedSlot || bookingSuccess}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-md py-3 text-xs font-bold text-white transition-all shadow-glow-purple",
                    selectedSlot 
                      ? "bg-primary hover:bg-primary-hover active:scale-95 cursor-pointer" 
                      : "bg-surface border border-border-glass text-text-muted cursor-not-allowed"
                  )}
                >
                  {bookingSuccess ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Band qilinmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>Navbatga yozilish</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {bookingSuccess && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse">
                Uchrashuv muvaffaqiyatli band qilindi! Chiptalar sahifasiga yo'naltirilmoqdasiz...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SHARING COLLAGE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel border border-border-glass rounded-2xl p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary h-7 w-7 rounded-full bg-surface/50 border border-border-glass flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-display text-lg font-bold text-text-primary">Ko'rinishingizni ulashing</h3>
              <p className="font-sans text-xs text-text-muted">AI tomonidan yaratilgan soch turmagi kartasi</p>
            </div>

            {/* Collage Canvas Design */}
            <div className="border border-border-glass bg-canvas rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-display text-xs font-bold tracking-widest text-primary">STYLEME AI</span>
                <span className="text-[8px] text-text-muted">ID: {analysisId.substring(0, 8) || 'PREVIEW'}</span>
              </div>

              {/* Side-by-side comparison images */}
              <div className="grid grid-cols-2 gap-2 aspect-[4/3] rounded-lg overflow-hidden">
                <div className="relative">
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] border border-border-glass text-white">
                    Selfie (Avval)
                  </span>
                </div>
                <div className="relative">
                  {selectedStyleImage && (
                    <img
                      src={selectedStyleImage}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 bg-primary/80 px-2 py-0.5 rounded text-[8px] border border-primary-glow text-white">
                    AI Preview (Keyin)
                  </span>
                </div>
              </div>

              {/* Details and mock QR Code */}
              <div className="flex justify-between items-center gap-4 bg-surface/55 p-3 rounded-lg border border-border-glass">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[8px] text-text-muted uppercase tracking-wider font-bold">Yangi Uslub:</span>
                    <h5 className="text-xs font-bold text-text-primary">{selectedStyle || 'Textured Crop Fade'}</h5>
                  </div>
                  <div>
                    <span className="text-[8px] text-text-muted uppercase tracking-wider font-bold">Tavsiya etilgan usta:</span>
                    <p className="text-[10px] text-text-muted">{recommendedBarber?.full_name || 'Ustani tanlash'}</p>
                  </div>
                </div>

                {/* Styled Vector QR Code */}
                <div className="h-14 w-14 rounded-md bg-white p-1 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-full w-full text-black">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="20" height="20" fill="black" />
                    <rect x="15" y="15" width="10" height="10" fill="white" />
                    <rect x="70" y="10" width="20" height="20" fill="black" />
                    <rect x="75" y="15" width="10" height="10" fill="white" />
                    <rect x="10" y="70" width="20" height="20" fill="black" />
                    <rect x="15" y="75" width="10" height="10" fill="white" />
                    <rect x="40" y="40" width="20" height="20" fill="black" />
                    {/* Random squares representing QR payload */}
                    <rect x="45" y="15" width="10" height="10" fill="black" />
                    <rect x="45" y="75" width="10" height="10" fill="black" />
                    <rect x="75" y="45" width="10" height="10" fill="black" />
                    <rect x="15" y="45" width="10" height="10" fill="black" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sharing and Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`https://t.me/share/url?url=https://styleme.uz/tryon/${analysisId}&text=StyleMe%20AI%20yordamida%20sochimga%20mos%20yangi%20uslub%20tanladim!%20O'z%20rasmingizda%20sinab%20ko'ring:`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-4 h-11 text-xs font-semibold text-white shadow-glow-purple transition-all"
              >
                <Send className="h-4 w-4" />
                <span>Telegramda ulashish</span>
              </a>

              <button
                onClick={() => {
                  if (selectedStyleImage) {
                    const link = document.createElement('a');
                    link.href = selectedStyleImage;
                    link.download = `styleme_ai_result_${analysisId}.jpg`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                  setIsShareModalOpen(false);
                }}
                className="flex items-center justify-center gap-2 rounded-md border border-border-glass bg-surface hover:bg-border-glass/40 px-4 h-11 text-xs font-semibold text-text-primary transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Kartani Yuklash</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 7. STYLEME AI PRO SUBSCRIPTION MODAL */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel border border-primary/30 rounded-2xl p-6 space-y-6 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[50px]"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-[50px]"></div>
            
            {/* Close button */}
            <button
              onClick={() => setIsSubscriptionModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary h-7 w-7 rounded-full bg-surface/50 border border-border-glass flex items-center justify-center transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                <Star className="h-3.5 w-3.5 fill-primary" />
                <span>Premium Plan</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-text-primary">StyleMe AI Pro</h3>
              <p className="font-sans text-sm text-text-muted">Cheksiz generatsiyalar va AI avto-tanlov funksiyasi.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              {/* Monthly Plan */}
              <button 
                onClick={() => setSubscriptionPlan('monthly')}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                  subscriptionPlan === 'monthly' ? "border-primary bg-primary/10" : "border-border-glass bg-surface hover:border-primary/50"
                )}
              >
                <span className="text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">Oylik</span>
                <span className="text-2xl font-display font-bold text-text-primary">$5</span>
                <span className="text-[10px] text-text-muted mt-1">/ oyiga</span>
              </button>

              {/* Yearly Plan */}
              <button 
                onClick={() => setSubscriptionPlan('yearly')}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all relative overflow-hidden",
                  subscriptionPlan === 'yearly' ? "border-primary bg-primary/10 shadow-glow-purple" : "border-border-glass bg-surface hover:border-primary/50"
                )}
              >
                <div className="absolute top-0 right-0 bg-success text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                  SAVE $10
                </div>
                <span className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Yillik</span>
                <span className="text-2xl font-display font-bold text-text-primary">$50</span>
                <span className="text-[10px] text-text-muted mt-1">/ yiliga</span>
              </button>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>AI sizga eng mosini avtomatik tanlaydi</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Yuqori sifatli (HD) natijalar</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Cheksiz Try-On generatsiyalar</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert("To'lov tizimi tez orada qo'shiladi!");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple py-3.5 text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 relative z-10"
            >
              <span>Get Pro Access</span>
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
