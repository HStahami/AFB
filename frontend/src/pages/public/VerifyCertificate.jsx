import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Award, 
  Calendar, 
  Clock, 
  Zap, 
  Target, 
  User, 
  Hash, 
  ExternalLink,
  Printer
} from 'lucide-react';
import { typingApi } from '../../api';
import TypingCertificateModal from '../../components/typing/TypingCertificateModal';

export function VerifyCertificate() {
  const { certId: paramCertId } = useParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(paramCertId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (paramCertId) {
      setSearchInput(paramCertId);
      performVerification(paramCertId);
    }
  }, [paramCertId]);

  const performVerification = async (idToVerify) => {
    const trimmed = (idToVerify || '').trim();
    if (!trimmed) {
      setError('Please enter a certificate ID to verify');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await typingApi.verifyCertificate(trimmed);
      if (res && res.valid && res.certificate) {
        setResult(res.certificate);
      } else {
        setError(res?.message || 'No certificate found matching this credential ID in the central registry.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred while connecting to the verification server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/verify-certificate/${searchInput.trim()}`);
      performVerification(searchInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#041416] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c3e42]/60 border border-[#14494e] text-[#C5E5E8] text-xs font-semibold">
            <ShieldCheck size={16} className="text-[#dfb259]" />
            <span>Official Credential Registry</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide">
            Verify Arabic Touch-Typing Certificate
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Instant credential verification for academic and employment institutions. Authenticate official Arabic Touch-Typing Mastery certificates issued by Emam Platform.
          </p>
        </div>

        {/* Verification Search Bar */}
        <div className="bg-[#072224] border border-[#14494e] rounded-2xl p-4 sm:p-6 shadow-xl">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Certificate ID (e.g., CERT-AR-948210)"
                className="w-full pl-10 pr-4 py-3 bg-[#05181a] border border-[#14494e] rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#C5E5E8] transition-colors"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#dfb259] to-[#b8862d] text-[#072224] font-bold text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Verify Now</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-semibold">{error}</p>
                <p className="text-[11px] text-red-400/80 mt-0.5">
                  Please make sure the certificate ID is typed exactly as shown on the credential document.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Verified Result Card */}
        {result && (
          <div className="bg-[#072224] border-2 border-emerald-500/50 rounded-2xl overflow-hidden shadow-2xl">
            {/* Verification Status Header */}
            <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-emerald-300">
                      Officially Verified & Authenticated Credential
                    </h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      Active & Valid
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    The credential records below match the official central registry.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#dfb259] to-[#b8862d] text-[#072224] text-xs font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md self-end sm:self-auto"
              >
                <Award size={15} />
                <span>View Official Certificate</span>
              </button>
            </div>

            {/* Recipient & Metadata Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Recipient Spotlight */}
              <div className="bg-[#05181a] border border-[#14494e] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#0c3e42] border border-[#1a5b61] flex items-center justify-center text-[#dfb259]">
                    <User size={28} />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Recipient Student Name</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                      {result.student_name}
                    </h2>
                    <span className="text-xs text-emerald-400 font-medium">
                      Completed all 200 levels of the Arabic Touch-Typing Curriculum
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#14494e]/60">
                  <span className="text-xs text-gray-400">Official Certificate ID</span>
                  <div className="text-sm font-mono font-bold text-[#dfb259] mt-0.5" dir="ltr">
                    {result.certificate_id}
                  </div>
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#05181a] border border-[#14494e] rounded-xl p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-2">
                    <Award size={16} />
                  </div>
                  <span className="text-[11px] text-gray-400">Completed Levels</span>
                  <p className="text-base sm:text-lg font-bold text-white mt-1">
                    {result.levels_completed || '200 / 200'}
                  </p>
                </div>

                <div className="bg-[#05181a] border border-[#14494e] rounded-xl p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-2">
                    <Target size={16} />
                  </div>
                  <span className="text-[11px] text-gray-400">Average Accuracy</span>
                  <p className="text-base sm:text-lg font-bold text-[#dfb259] mt-1">
                    {result.avg_accuracy}
                  </p>
                </div>

                <div className="bg-[#05181a] border border-[#14494e] rounded-xl p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                    <Zap size={16} />
                  </div>
                  <span className="text-[11px] text-gray-400">Average Typing Speed</span>
                  <p className="text-base sm:text-lg font-bold text-[#dfb259] mt-1">
                    {result.avg_wpm}
                  </p>
                </div>

                <div className="bg-[#05181a] border border-[#14494e] rounded-xl p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-2">
                    <Clock size={16} />
                  </div>
                  <span className="text-[11px] text-gray-400">Practice Time</span>
                  <p className="text-base sm:text-lg font-bold text-white mt-1">
                    {result.total_time}
                  </p>
                </div>
              </div>

              {/* Administrative Details Table */}
              <div className="bg-[#05181a] border border-[#14494e] rounded-xl p-4 sm:p-5">
                <h4 className="text-xs font-bold text-[#C5E5E8] mb-3 pb-2 border-b border-[#14494e]/70">
                  Issuance & Institutional Records
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Student ID / Code:</span>
                    <p className="font-mono font-bold text-white mt-0.5" dir="ltr">
                      {result.student_code}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Issue Date:</span>
                    <p className="font-bold text-white mt-0.5">
                      {result.issue_date}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Issuing Authority:</span>
                    <p className="font-bold text-white mt-0.5">
                      Emam Platform
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[#dfb259] to-[#b8862d] text-[#072224] font-bold text-xs sm:text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                >
                  <Award size={18} />
                  <span>View Official Certificate</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Official Certificate Modal */}
      {result && (
        <TypingCertificateModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          certificate={result}
        />
      )}
    </div>
  );
}
