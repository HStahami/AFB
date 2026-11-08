import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Keyboard, 
  Award, 
  Trophy, 
  Clock, 
  Target, 
  Zap, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Layers,
  HelpCircle,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { typingApi } from '../../api';
import TypingCertificateModal from '../../components/typing/TypingCertificateModal';

// QWERTY to Arabic 101 Mapping for automatic transliteration if OS keyboard is in English
const QWERTY_TO_ARABIC = {
  'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'د',
  'a': 'ش', 's': 'س', 'd': 'ي', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ك', "'": 'ط',
  'z': 'ئ', 'x': 'ء', 'c': 'ؤ', 'v': 'ر', 'b': 'لا', 'n': 'ى', 'm': 'ة', ',': 'و', '.': 'ز', '/': 'ظ', '`': 'ذ',
  'Q': 'َ', 'W': 'ً', 'E': 'ُ', 'R': 'ٌ', 'A': 'ِ', 'S': 'ٍ', 'X': 'ْ', '~': 'ّ',
  'H': 'أ', 'Y': 'إ', 'N': 'آ', 'Z': 'ئ', 'K': '،', 'P': '؛', '?': '؟'
};

// Keyboard layout rows for the on-screen visual keyboard
const KEYBOARD_ROWS = [
  [
    { ar: 'ذ', en: '`', finger: 'left-pinky' },
    { ar: '1', en: '1', finger: 'left-pinky' },
    { ar: '2', en: '2', finger: 'left-ring' },
    { ar: '3', en: '3', finger: 'left-middle' },
    { ar: '4', en: '4', finger: 'left-index' },
    { ar: '5', en: '5', finger: 'left-index' },
    { ar: '6', en: '6', finger: 'right-index' },
    { ar: '7', en: '7', finger: 'right-index' },
    { ar: '8', en: '8', finger: 'right-middle' },
    { ar: '9', en: '9', finger: 'right-ring' },
    { ar: '0', en: '0', finger: 'right-pinky' },
    { ar: '-', en: '-', finger: 'right-pinky' },
    { ar: '=', en: '=', finger: 'right-pinky' },
    { ar: 'Backspace', en: 'Backspace', isSpecial: true, width: 'w-20', finger: 'right-pinky' }
  ],
  [
    { ar: 'Tab', en: 'Tab', isSpecial: true, width: 'w-16', finger: 'left-pinky' },
    { ar: 'ض', en: 'q', finger: 'left-pinky' },
    { ar: 'ص', en: 'w', finger: 'left-ring' },
    { ar: 'ث', en: 'e', finger: 'left-middle' },
    { ar: 'ق', en: 'r', finger: 'left-index' },
    { ar: 'ف', en: 't', finger: 'left-index' },
    { ar: 'غ', en: 'y', finger: 'right-index' },
    { ar: 'ع', en: 'u', finger: 'right-index' },
    { ar: 'ه', en: 'i', finger: 'right-middle' },
    { ar: 'خ', en: 'o', finger: 'right-ring' },
    { ar: 'ح', en: 'p', finger: 'right-pinky' },
    { ar: 'ج', en: '[', finger: 'right-pinky' },
    { ar: 'د', en: ']', finger: 'right-pinky' },
    { ar: '\\', en: '\\', finger: 'right-pinky' }
  ],
  [
    { ar: 'Caps', en: 'Caps', isSpecial: true, width: 'w-20', finger: 'left-pinky' },
    { ar: 'ش', en: 'a', finger: 'left-pinky' },
    { ar: 'س', en: 's', finger: 'left-ring' },
    { ar: 'ي', en: 'd', finger: 'left-middle' },
    { ar: 'ب', en: 'f', isAnchor: true, finger: 'left-index' }, // Home Anchor F
    { ar: 'ل', en: 'g', finger: 'left-index' },
    { ar: 'ا', en: 'h', finger: 'right-index' },
    { ar: 'ت', en: 'j', isAnchor: true, finger: 'right-index' }, // Home Anchor J
    { ar: 'ن', en: 'k', finger: 'right-middle' },
    { ar: 'م', en: 'l', finger: 'right-ring' },
    { ar: 'ك', en: ';', finger: 'right-pinky' },
    { ar: 'ط', en: "'", finger: 'right-pinky' },
    { ar: 'Enter', en: 'Enter', isSpecial: true, width: 'w-20', finger: 'right-pinky' }
  ],
  [
    { ar: 'Shift', en: 'Shift', isSpecial: true, width: 'w-24', finger: 'left-pinky' },
    { ar: 'ئ', en: 'z', finger: 'left-pinky' },
    { ar: 'ء', en: 'x', finger: 'left-ring' },
    { ar: 'ؤ', en: 'c', finger: 'left-middle' },
    { ar: 'ر', en: 'v', finger: 'left-index' },
    { ar: 'لا', en: 'b', finger: 'left-index' },
    { ar: 'ى', en: 'n', finger: 'right-index' },
    { ar: 'ة', en: 'm', finger: 'right-index' },
    { ar: 'و', en: ',', finger: 'right-middle' },
    { ar: 'ز', en: '.', finger: 'right-ring' },
    { ar: 'ظ', en: '/', finger: 'right-pinky' },
    { ar: 'Shift', en: 'Shift', isSpecial: true, width: 'w-24', finger: 'right-pinky' }
  ],
  [
    { ar: 'Ctrl', en: 'Ctrl', isSpecial: true, width: 'w-16', finger: 'left-pinky' },
    { ar: 'Alt', en: 'Alt', isSpecial: true, width: 'w-16', finger: 'left-thumb' },
    { ar: ' ', en: 'Space', isSpace: true, width: 'flex-1 max-w-lg', finger: 'thumb' },
    { ar: 'Alt', en: 'Alt', isSpecial: true, width: 'w-16', finger: 'right-thumb' },
    { ar: 'Ctrl', en: 'Ctrl', isSpecial: true, width: 'w-16', finger: 'right-pinky' }
  ]
];

// Color coding styles for finger zones
const FINGER_COLORS = {
  'left-pinky': 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  'left-ring': 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  'left-middle': 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  'left-index': 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  'right-index': 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  'right-middle': 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  'right-ring': 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  'right-pinky': 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  'thumb': 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  'default': 'border-[#14494e] bg-[#072224] text-gray-300'
};

export default function StudentTypingLab() {
  const [stages, setStages] = useState([]);
  const [levelsSummary, setLevelsSummary] = useState([]);
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [levelData, setLevelData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Typing Arena States
  const [typedChars, setTypedChars] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errorsCount, setErrorsCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [levelResult, setLevelResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // UI Drawers & Modals
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // Load initial progress and level metadata
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [stagesRes, levelsRes, progRes] = await Promise.all([
          typingApi.getStages(),
          typingApi.getLevels(false),
          typingApi.getProgress().catch(() => ({ progress: { current_level: 1, completed_levels: {} } }))
        ]);

        setStages(stagesRes.stages || []);
        setLevelsSummary(levelsRes.levels || []);

        const prog = progRes.progress || { current_level: 1, completed_levels: {} };
        setProgress(prog);

        const activeLvl = prog.current_level || 1;
        setCurrentLevelId(activeLvl);
        await loadLevel(activeLvl);
      } catch (err) {
        console.error('Failed to init typing lab:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Load specific level
  const loadLevel = async (lvlId) => {
    try {
      const res = await typingApi.getLevel(lvlId);
      if (res.success && res.level) {
        setLevelData(res.level);
        resetLevelState(res.level.text);
      }
    } catch (err) {
      console.error(`Failed to load level ${lvlId}:`, err);
    }
  };

  const resetLevelState = (text = levelData?.text || '') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTypedChars([]);
    setCurrentIndex(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setWpm(0);
    setAccuracy(100);
    setErrorsCount(0);
    setIsCompleted(false);
    setLevelResult(null);
  };

  // Timer loop
  useEffect(() => {
    if (startTime && !isCompleted) {
      timerRef.current = setInterval(() => {
        const seconds = Math.max(1, (Date.now() - startTime) / 1000);
        setElapsedSeconds(Math.floor(seconds));

        // Calculate live WPM: (correct characters / 5) / (seconds / 60)
        const correctCount = typedChars.filter(c => c.status === 'correct').length;
        const currentWpm = Math.round((correctCount / 5) / (seconds / 60));
        setWpm(isNaN(currentWpm) ? 0 : currentWpm);

        // Calculate live accuracy
        const total = typedChars.length;
        if (total > 0) {
          const acc = Math.round((correctCount / total) * 100);
          setAccuracy(acc);
        }
      }, 500);
    }
    return () => clearInterval(timerRef.current);
  }, [startTime, isCompleted, typedChars]);

  // Audio feedback (gentle pleasant clicks)
  const playClickSound = (isError = false) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = isError ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isError ? 180 : 540, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // AudioContext may be restricted before user gesture
    }
  };

  // Handle keystroke logic
  const handleKeyDown = useCallback((e) => {
    if (isCompleted || !levelData) return;

    // Ignore modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    const targetText = levelData.text || '';
    if (currentIndex >= targetText.length) return;

    // Handle Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setTypedChars(prev => prev.slice(0, -1));
      }
      return;
    }

    e.preventDefault();

    // Map key from QWERTY if typed in English
    let inputChar = e.key;
    if (QWERTY_TO_ARABIC[inputChar]) {
      inputChar = QWERTY_TO_ARABIC[inputChar];
    }

    // Start timer on first keystroke
    if (!startTime) {
      setStartTime(Date.now());
    }

    const expectedChar = targetText[currentIndex];
    const isCorrect = (inputChar === expectedChar);

    playClickSound(!isCorrect);

    const newTyped = [
      ...typedChars,
      {
        expected: expectedChar,
        actual: inputChar,
        status: isCorrect ? 'correct' : 'incorrect'
      }
    ];

    setTypedChars(newTyped);
    if (!isCorrect) {
      setErrorsCount(prev => prev + 1);
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    // Check if level completed
    if (nextIndex >= targetText.length) {
      handleLevelCompletion(newTyped);
    }
  }, [currentIndex, isCompleted, levelData, startTime, typedChars, soundEnabled]);

  // Bind global keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Submit level result when finished
  const handleLevelCompletion = async (finalTyped) => {
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Math.max(1, (Date.now() - (startTime || Date.now())) / 1000);
    const correctCount = finalTyped.filter(c => c.status === 'correct').length;
    const finalAccuracy = Math.round((correctCount / finalTyped.length) * 100);
    const finalWpm = Math.round((correctCount / 5) / (timeTaken / 60));

    setWpm(finalWpm);
    setAccuracy(finalAccuracy);

    try {
      setSubmitting(true);
      const res = await typingApi.submitResult({
        level_id: currentLevelId,
        wpm: finalWpm,
        accuracy: finalAccuracy,
        time_taken_seconds: timeTaken,
        errors_count: errorsCount
      });

      setLevelResult(res);

      // Refresh progress
      const updatedProgRes = await typingApi.getProgress();
      if (updatedProgRes.success) {
        setProgress(updatedProgRes.progress);
      }

      // If Level 200 completed or certificate unlocked, fetch certificate data
      if (res.certificate_unlocked || currentLevelId === 200) {
        const certRes = await typingApi.getCertificate();
        if (certRes.success && certRes.certificate) {
          setCertificateData(certRes.certificate);
          // Show Certificate modal on completing Level 200!
          setTimeout(() => setShowCertModal(true), 1200);
        }
      }
    } catch (err) {
      console.error('Failed to submit level result:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Next level navigation
  const handleNextLevel = () => {
    if (currentLevelId < 200) {
      const nextId = currentLevelId + 1;
      setCurrentLevelId(nextId);
      loadLevel(nextId);
    }
  };

  // Open Certificate Modal
  const handleOpenCertificate = async () => {
    try {
      const certRes = await typingApi.getCertificate();
      if (certRes.success && certRes.certificate) {
        setCertificateData(certRes.certificate);
        setShowCertModal(true);
      }
    } catch (err) {
      console.error('Failed to load certificate:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#C5E5E8] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-300">جارٍ تحميل مَخْبَرُ الكِتَابَة العربية ومستوياته...</p>
      </div>
    );
  }

  const currentTargetChar = levelData?.text?.[currentIndex] || '';
  const isLevelUnlocked = (lvlId) => {
    if (!progress) return lvlId === 1;
    return lvlId <= (progress.current_level || 1);
  };

  return (
    <div className="space-y-6 pb-12" ref={containerRef}>
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="bg-[#092a2d] border border-[#14494e] rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#dfb259] to-[#b8862d] text-[#072224] shadow-sm flex items-center gap-1.5">
                <Trophy size={13} />
                <span>المستوى {currentLevelId} من 200</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#072224] text-[#C5E5E8] border border-[#14494e]">
                {levelData?.stage_title || 'المرحلة الحالية'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
              <Keyboard className="text-[#C5E5E8]" size={30} />
              <span>مَخْبَرُ الكِتَابَة باللغة العربية</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              برنامج احترافي متدرج لتعلم الطباعة باللمس بجميع الأصابع عبر 200 مستوى للحصول على شهادة الإتقان المعتمدة.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowRoadmap(true)}
              className="px-4 py-2.5 rounded-xl bg-[#072224] border border-[#14494e] hover:border-[#C5E5E8] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Layers size={16} className="text-[#C5E5E8]" />
              <span>خريطة الـ 200 مستوى</span>
            </button>

            {/* Certificate Unlock / Preview Button */}
            <button
              onClick={handleOpenCertificate}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
                progress?.certificate_unlocked || currentLevelId >= 200
                  ? 'bg-gradient-to-r from-[#dfb259] to-[#b8862d] text-[#072224] animate-pulse hover:brightness-110'
                  : 'bg-[#14494e] text-[#C5E5E8] hover:bg-[#1a5b61]'
              }`}
            >
              <Award size={16} />
              <span>{progress?.certificate_unlocked ? 'عرض الشهادة المعتمدة' : 'معاينة الشهادة الرسمية'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-xl bg-[#072224] border border-[#14494e] text-gray-300 hover:text-white transition-colors"
              title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت النقر'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* Global Student Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#14494e]/70">
          <div className="bg-[#072224]/80 border border-[#14494e] rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">متوسط السرعة</div>
              <div className="text-base font-extrabold text-white">
                {progress?.avg_wpm || 0} <span className="text-xs font-normal text-gray-400">ك/د</span>
              </div>
            </div>
          </div>

          <div className="bg-[#072224]/80 border border-[#14494e] rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target size={20} />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">متوسط الدقة</div>
              <div className="text-base font-extrabold text-white">
                {progress?.avg_accuracy || 100}%
              </div>
            </div>
          </div>

          <div className="bg-[#072224]/80 border border-[#14494e] rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">إجمالي وقت التدريب</div>
              <div className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[140px]">
                {Math.floor((progress?.total_practice_seconds || 0) / 60)} دقيقة
              </div>
            </div>
          </div>

          <div className="bg-[#072224]/80 border border-[#14494e] rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#dfb259]/10 border border-[#dfb259]/20 flex items-center justify-center text-[#dfb259]">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">المستويات المكتملة</div>
              <div className="text-base font-extrabold text-[#dfb259]">
                {Object.keys(progress?.completed_levels || {}).length} / 200
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE PRACTICE ARENA */}
      <div className="bg-[#092a2d] border border-[#14494e] rounded-2xl p-5 sm:p-7 shadow-xl">
        
        {/* Level Goal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#14494e]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{levelData?.title || `المستوى ${currentLevelId}`}</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">المفاتيح المستهدفة:</span>
              <div className="flex items-center gap-1">
                {(levelData?.target_keys || []).map((k, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[#072224] border border-[#14494e] text-[#C5E5E8] font-bold text-xs">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Target Criteria Badges */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-[#072224] border border-[#14494e] text-gray-300">
              الدقة المطلوبة: <strong className="text-white font-bold">{levelData?.min_accuracy}%</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#072224] border border-[#14494e] text-gray-300">
              السرعة المطلوبة: <strong className="text-white font-bold">{levelData?.min_wpm} ك/د</strong>
            </div>
            <button
              onClick={() => resetLevelState()}
              className="p-2 rounded-lg bg-[#072224] hover:bg-[#14494e] text-gray-300 hover:text-white transition-colors"
              title="إعادة بدء المستوى"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Live Typing HUD */}
        <div className="flex items-center justify-between gap-4 py-2 px-4 bg-[#072224] rounded-xl border border-[#14494e] mb-5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>السرعة الحالية:</span>
              <span className="text-base font-extrabold text-cyan-400 font-mono">{wpm}</span>
              <span className="text-[10px]">ك/د</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>الدقة الحالية:</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">{accuracy}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>الوقت:</span>
              <span className="text-base font-extrabold text-[#dfb259] font-mono">{elapsedSeconds} ثانية</span>
            </div>
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span>التقدم:</span>
            <span className="font-mono text-white font-bold">
              {currentIndex} / {levelData?.text?.length || 0}
            </span>
          </div>
        </div>

        {/* Interactive Target Text Box */}
        <div
          onClick={() => containerRef.current?.focus()}
          className="relative min-h-[140px] p-6 bg-[#041416] border-2 border-[#1a5b61] rounded-2xl flex flex-wrap items-center content-center gap-y-3 font-mono text-xl sm:text-2xl leading-loose tracking-wider select-none cursor-text shadow-inner transition-all focus-within:border-[#C5E5E8]"
          style={{ direction: 'rtl', fontFamily: "'Cairo', 'Amiri', monospace" }}
        >
          {(levelData?.text || '').split('').map((char, index) => {
            const typed = typedChars[index];
            const isCurrent = index === currentIndex;

            let charColor = 'text-gray-500';
            let bgHighlight = '';

            if (typed) {
              if (typed.status === 'correct') {
                charColor = 'text-emerald-400 font-bold';
              } else {
                charColor = 'text-rose-400 font-bold';
                bgHighlight = 'bg-rose-500/20 rounded';
              }
            } else if (isCurrent) {
              charColor = 'text-white font-black underline decoration-[#dfb259] decoration-4 underline-offset-8';
              bgHighlight = 'bg-[#dfb259]/20 rounded px-1 animate-pulse';
            }

            return (
              <span
                key={index}
                className={`relative inline-block transition-colors duration-75 ${charColor} ${bgHighlight} ${
                  char === ' ' ? 'w-3' : 'px-0.5'
                }`}
              >
                {char === ' ' ? (isCurrent ? '␣' : ' ') : char}
              </span>
            );
          })}
        </div>

        {/* Finger Placement Instruction Hint */}
        <div className="flex items-center justify-between gap-3 mt-4 text-xs text-gray-400 px-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dfb259] animate-ping"></span>
            <span>الحرف الحالي المطلوب:</span>
            <span className="font-bold text-white text-sm px-2 py-0.5 rounded bg-[#072224] border border-[#14494e]">
              {currentTargetChar === ' ' ? 'مسافة (Space)' : currentTargetChar}
            </span>
          </div>

          <div className="text-[11px] text-[#C5E5E8] flex items-center gap-1.5">
            <HelpCircle size={14} />
            <span>يمكنك الكتابة بلوحة المفاتيح العربية أو الإنجليزية مباشرة (يتم التحويل تلقائياً).</span>
          </div>
        </div>

      </div>

      {/* 3. REALISTIC INTERACTIVE VIRTUAL KEYBOARD */}
      <div className="bg-[#092a2d] border border-[#14494e] rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#14494e]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Keyboard size={18} className="text-[#C5E5E8]" />
            <span>لوحة المفاتيح التفاعلية وتوزيع الأصابع المعتمد</span>
          </h3>

          {/* Finger Zones Legend */}
          <div className="hidden lg:flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> الخنصر</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> البنصر</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> الوسطى</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> السبابة</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> الإبهام</span>
          </div>
        </div>

        {/* Keyboard Keys Grid */}
        <div className="flex flex-col gap-1.5 max-w-4xl mx-auto select-none p-3 bg-[#041416] rounded-xl border border-[#14494e]">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1.5">
              {row.map((k, kIdx) => {
                const isActive = (k.ar === currentTargetChar) || (k.isSpace && currentTargetChar === ' ');
                const fingerClass = FINGER_COLORS[k.finger] || FINGER_COLORS['default'];

                return (
                  <div
                    key={kIdx}
                    className={`relative flex flex-col items-center justify-center rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                      k.width || 'w-10 sm:w-12'
                    } h-10 sm:h-12 ${
                      isActive
                        ? 'bg-gradient-to-br from-[#dfb259] to-[#b8862d] text-[#072224] border-[#dfb259] scale-105 shadow-lg shadow-[#dfb259]/30 ring-2 ring-[#dfb259]'
                        : fingerClass
                    } ${k.isAnchor ? 'border-b-4 border-b-cyan-400' : ''}`}
                  >
                    <span>{k.ar}</span>
                    <span className="text-[9px] opacity-40 font-mono hidden sm:inline">{k.en}</span>
                    {k.isAnchor && (
                      <span className="absolute bottom-0.5 w-2 h-0.5 bg-white/60 rounded"></span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 4. LEVEL COMPLETION MODAL */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#092a2d] border border-[#14494e] rounded-2xl max-w-md w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
            {levelResult?.passed ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 mb-3 shadow-lg">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-1">
                  مبارك! أتممت المستوى {currentLevelId} بنجاح
                </h3>
                <p className="text-xs text-gray-300 mb-4">
                  أظهرت دقة ممتازة وسرعة متوافقة مع متطلبات المستوى.
                </p>

                {/* Stars Display */}
                <div className="flex items-center justify-center gap-2 mb-5">
                  {[1, 2, 3].map((starIdx) => (
                    <Star
                      key={starIdx}
                      size={28}
                      className={starIdx <= (levelResult?.stars || 1) ? 'text-[#dfb259] fill-[#dfb259]' : 'text-gray-600'}
                    />
                  ))}
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6 bg-[#072224] p-3 rounded-xl border border-[#14494e]">
                  <div>
                    <div className="text-[11px] text-gray-400">السرعة المحققة</div>
                    <div className="text-lg font-black text-cyan-400 font-mono">{wpm} ك/د</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">الدقة المحققة</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">{accuracy}%</div>
                  </div>
                </div>

                {/* Level 200 Final Championship Banner */}
                {currentLevelId === 200 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#dfb259]/20 to-[#b8862d]/20 border border-[#dfb259] mb-5">
                    <Sparkles className="text-[#dfb259] mx-auto mb-1" size={24} />
                    <h4 className="text-sm font-bold text-white">إنجاز تاريخي! لقد أتممت الـ 200 مستوى</h4>
                    <p className="text-xs text-[#dfb259] mt-0.5">
                      تم إصدار شهادة الإتقان والتفوق المعتمدة باسمك بنجاح!
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {currentLevelId === 200 ? (
                    <button
                      onClick={handleOpenCertificate}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#dfb259] to-[#b8862d] text-[#072224] font-extrabold text-sm hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
                    >
                      <Award size={18} />
                      <span>عرض الشهادة الرسمية</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleNextLevel}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span>الانتقال للمستوى التالي</span>
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => resetLevelState()}
                    className="px-4 py-3 rounded-xl bg-[#072224] hover:bg-[#14494e] text-gray-300 font-medium text-xs transition-colors"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 mb-3 shadow-lg">
                  <RotateCcw size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-1">
                  لم يتم استيفاء شروط المستوى
                </h3>
                <p className="text-xs text-gray-300 mb-4">
                  المطلوب: دقة لا تقل عن {levelData?.min_accuracy}% وسرعة {levelData?.min_wpm} ك/د.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 bg-[#072224] p-3 rounded-xl border border-[#14494e]">
                  <div>
                    <div className="text-[11px] text-gray-400">السرعة الحالية</div>
                    <div className="text-lg font-bold text-white font-mono">{wpm} ك/د</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">الدقة الحالية</div>
                    <div className="text-lg font-bold text-rose-400 font-mono">{accuracy}%</div>
                  </div>
                </div>

                <button
                  onClick={() => resetLevelState()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold text-sm hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  <span>إعادة المحاولة مجدداً</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. LEVELS ROADMAP DRAWER */}
      {showRoadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#092a2d] border border-[#14494e] rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#14494e] bg-[#072224]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={20} className="text-[#C5E5E8]" />
                  <span>خريطة الـ 200 مستوى (المراحل العشر)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  اختر أي مستوى متاح للتدريب أو تحسين النتيجة
                </p>
              </div>
              <button
                onClick={() => setShowRoadmap(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stages & Levels Grid */}
            <div className="p-6 overflow-y-auto space-y-6">
              {stages.map((stage) => {
                const [startLvl, endLvl] = stage.levels_range;
                const stageLevels = levelsSummary.filter(
                  l => l.level_id >= startLvl && l.level_id <= endLvl
                );

                return (
                  <div key={stage.id} className="bg-[#072224] border border-[#14494e] rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-[#14494e]/70">
                      <div>
                        <h4 className="text-sm font-bold text-[#C5E5E8]">{stage.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{stage.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        المستويات {startLvl} - {endLvl}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {stageLevels.map((lvl) => {
                        const isUnlocked = isLevelUnlocked(lvl.level_id);
                        const isCompleted = !!progress?.completed_levels?.[String(lvl.level_id)];
                        const isCurrent = lvl.level_id === currentLevelId;

                        return (
                          <button
                            key={lvl.level_id}
                            disabled={!isUnlocked}
                            onClick={() => {
                              setCurrentLevelId(lvl.level_id);
                              loadLevel(lvl.level_id);
                              setShowRoadmap(false);
                            }}
                            className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-gradient-to-br from-[#dfb259] to-[#b8862d] text-[#072224] ring-2 ring-[#dfb259] shadow-md scale-105'
                                : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : isUnlocked
                                ? 'bg-[#092a2d] text-white border border-[#14494e] hover:border-[#C5E5E8]'
                                : 'bg-[#05181a] text-gray-600 border border-white/5 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <span>{lvl.level_id}</span>
                            {isCompleted && (
                              <CheckCircle2 size={10} className="text-emerald-400 absolute bottom-1" />
                            )}
                            {!isUnlocked && (
                              <Lock size={10} className="text-gray-600 absolute bottom-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. OFFICIAL VERIFIED CERTIFICATE MODAL */}
      <TypingCertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        certificate={certificateData}
      />
    </div>
  );
}
