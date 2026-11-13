import React from 'react';
import { X, Printer, CheckCircle, ExternalLink } from 'lucide-react';

export default function TypingCertificateModal({ isOpen, onClose, certificate }) {
  if (!isOpen || !certificate) return null;

  const {
    student_name = 'اسم الطالب / الطالبة',
    student_code = 'EMAM-2026-0842',
    certificate_id = 'CERT-AR-948210',
    avg_accuracy = '98.5%',
    avg_wpm = '52 كلمة في الدقيقة',
    total_time = '18 ساعة و 40 دقيقة',
    issue_date = '08 نوفمبر 2026 م',
  } = certificate;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-transparent">
      {/* Container Card */}
      <div className="relative w-full max-w-5xl bg-[#092a2d] border border-[#14494e] rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        
        {/* Modal Action Header (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#14494e] bg-[#072224] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Official Verified Certificate</span>
                <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-[#14494e] text-[#C5E5E8] border border-[#1a5b61]">
                  Level 200 / 200
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Official credential issued by Emam Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#dfb259] to-[#b8862d] text-[#072224] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Display Canvas */}
        <div className="p-4 sm:p-8 flex justify-center bg-[#041416] print:p-0 print:bg-transparent">
          <div
            id="officialCertificateCanvas"
            className="relative w-full max-w-[1024px] aspect-[1024/723] rounded-none shadow-2xl flex flex-col justify-between p-7 sm:p-10 select-none overflow-hidden print:w-full print:h-full print:shadow-none"
            style={{
              background: 'radial-gradient(circle at 50% 35%, #0c3e42 0%, #082d30 65%, #051e20 100%)',
              clipPath: 'polygon(75px 0, 100% 0, 100% 100%, 0 100%, 0 75px)',
              boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(12, 62, 66, 0.5)',
              fontFamily: "'Cairo', 'Tajawal', sans-serif"
            }}
          >
            {/* Inner Border Frame matching chamfer cut */}
            <div
              className="absolute inset-[16px] pointer-events-none"
              style={{
                clipPath: 'polygon(65px 0, 100% 0, 100% 100%, 0 100%, 0 65px)',
                border: '1.5px solid rgba(197, 229, 232, 0.28)'
              }}
            />

            {/* Subtle Watermark on Left */}
            <img
              src="/emam_logo.png"
              alt=""
              className="absolute left-6 top-1/2 -translate-y-1/2 w-72 pointer-events-none filter drop-shadow-md"
              style={{ opacity: 0.035, pointerEvents: 'none' }}
            />

            {/* 1. TOP HEADER (Emam on Left, Title Center, Emam on Right) */}
            <div className="relative z-10 w-full flex items-start justify-between" style={{ direction: 'ltr' }}>
              {/* Emam Logo on Left */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center pt-1">
                <img
                  src="/emam_logo.png"
                  alt="Emam"
                  className="w-full h-full object-contain filter drop-shadow-md"
                />
              </div>

              {/* Title & Subtitle in Arabic RTL */}
              <div className="text-center flex-1 px-3 pt-1" style={{ direction: 'rtl' }}>
                <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-white tracking-wide mb-1 leading-tight">
                  شهادة إتمام وتفوق
                </h1>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-[#b6e4e8] tracking-normal">
                  في برنامج الطباعة باللغة العربية
                </p>
              </div>

              {/* Emam Logo on Right */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center pt-1">
                <img
                  src="/emam_logo.png"
                  alt="Emam"
                  className="w-full h-full object-contain filter drop-shadow-md"
                />
              </div>
            </div>

            {/* 2. BODY CONTENT */}
            <div className="relative z-10 w-full my-auto text-center py-1">
              <p className="text-xs sm:text-sm lg:text-base text-[#b6e4e8] font-semibold mb-2">
                تشهد منصة إمام بأن:
              </p>

              {/* Student Name */}
              <div className="my-1">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-wide">
                  {student_name}
                </h2>
                {/* Ornamental divider line */}
                <div className="flex items-center justify-center gap-3 my-2 opacity-75 max-w-[380px] mx-auto">
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#b6e4e8] to-[#b6e4e8]"></div>
                  <div className="w-2 h-2 rotate-45 border border-[#dfb259] bg-[#093437]"></div>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#b6e4e8] to-[#b6e4e8]"></div>
                </div>
              </div>

              {/* Commendation Paragraph */}
              <p className="text-[11px] sm:text-xs lg:text-[13.5px] text-[#d6eeee] leading-relaxed max-w-[760px] mx-auto text-center font-normal px-4">
                قد أتم بنجاح جميع مستويات برنامج الطباعة باللغة العربية، واستوفى متطلبات البرنامج، وأظهر كفاءة في دقة الكتابة، وسرعة الطباعة، وإتقان استخدام لوحة المفاتيح العربية. وقد منحت له/لها هذه الشهادة تقديرا لجهده/جهدها، واعترافا بإنجازه/إنجازها، وتحفيزا له/لها على مواصلة التعلم والتطور.
              </p>

              {/* 3 Metrics: Plain Text, Side-by-Side in Gold (Right: Time, Center: Speed, Left: Accuracy) */}
              <div className="flex items-center justify-between max-w-[800px] mx-auto mt-4 sm:mt-5 px-4 sm:px-6">
                {/* Total Time (Visual Right in RTL) */}
                <div className="text-center w-1/3">
                  <div className="text-[11px] sm:text-xs lg:text-[13.5px] text-[#b6e4e8] font-semibold mb-1">
                    إجمالي وقت الطباعة:
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base font-bold text-[#dfb259]">
                    {total_time}
                  </div>
                </div>

                {/* Average Speed (Visual Center) */}
                <div className="text-center w-1/3">
                  <div className="text-[11px] sm:text-xs lg:text-[13.5px] text-[#b6e4e8] font-semibold mb-1">
                    متوسط سرعة الطباعة:
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base font-bold text-[#dfb259]">
                    {avg_wpm}
                  </div>
                </div>

                {/* Average Accuracy (Visual Left in RTL) */}
                <div className="text-center w-1/3">
                  <div className="text-[11px] sm:text-xs lg:text-[13.5px] text-[#b6e4e8] font-semibold mb-1">
                    متوسط دقة الطباعة:
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base font-bold text-[#dfb259]">
                    {avg_accuracy}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. FOOTER (Stamp on Left, Disclaimer Center, Student Details on Right) */}
            <div className="relative z-10 w-full flex items-end justify-between pt-2" style={{ direction: 'ltr' }}>
              {/* Golden Stamp on Left */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '84px',
                  height: '84px',
                  minWidth: '84px',
                  minHeight: '84px',
                  aspectRatio: '1 / 1'
                }}
              >
                <img
                  src="/golden_seal_clean.png"
                  alt="Golden Seal"
                  className="w-full h-full object-contain filter drop-shadow-xl"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Disclaimer Center */}
              <div className="text-center px-2 sm:px-4 pb-2" style={{ direction: 'rtl' }}>
                <p className="text-[10px] sm:text-[11.5px] text-[#a0d4d8] font-normal">
                  هذه الشهادة صادرة إلكترونيًا بواسطة الحاسوب ولا تتطلب توقيعًا.
                </p>
              </div>

              {/* Student Details on Right */}
              <div className="text-right text-[10px] sm:text-xs space-y-1 text-[#d6eeee] font-sans pb-1 min-w-[180px] sm:min-w-[210px]" style={{ direction: 'rtl' }}>
                <div className="flex items-center justify-start gap-2">
                  <span className="text-[#b6e4e8] font-semibold">رقم القيد:</span>
                  <span className="text-white font-bold font-mono">{student_code}</span>
                </div>
                <div className="flex items-center justify-start gap-2">
                  <span className="text-[#b6e4e8] font-semibold">رقم الشهادة:</span>
                  <span className="text-white font-bold font-mono">{certificate_id}</span>
                </div>
                <div className="flex items-center justify-start gap-2">
                  <span className="text-[#b6e4e8] font-semibold">تاريخ الإصدار:</span>
                  <span className="text-white font-bold">{issue_date}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#14494e] bg-[#072224] print:hidden">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span>Official Verification Link:</span>
            <a
              href={`/verify-certificate/${certificate_id}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#C5E5E8] hover:underline flex items-center gap-1 font-mono"
            >
              <span>/verify-certificate/{certificate_id}</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#dfb259] to-[#b8862d] text-[#072224] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Print Certificate (A4 Landscape)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-[#14494e] hover:bg-[#1a5b61] text-white text-xs font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
