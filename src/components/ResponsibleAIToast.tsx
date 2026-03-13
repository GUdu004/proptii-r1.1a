import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

interface RAIVariant {
  id: string;
  toastTitle: string;
  image: string;
  modalTitle: string;
  modalIntro: string;
  sectionTitle: string;
  sectionIntro: string;
  bullets: string[];
  calloutBold: string;
  calloutText: string;
}

const variants: RAIVariant[] = [
  {
    id: 'fairness',
    toastTitle: 'Fairness First',
    image: '/images/responsible-ai/fairness-first.svg',
    modalTitle: 'We Built Fairness Into Our Code',
    modalIntro: "At Proptii, our AI doesn't just work - it works fairly for everyone.",
    sectionTitle: 'What this means for you:',
    sectionIntro:
      'At Proptii, we believe AI should treat everyone equally. To ensure we comply with Fair Housing regulations, we have engineered our models to strictly ignore "toxic data" that could lead to bias.',
    bullets: [
      'Our systems are specifically designed to comply with Fair Housing laws',
      "We've removed biased data inputs like arrest records and zip codes that could unfairly impact decisions",
      'Every AI model is tested for fairness before it ever reaches you',
    ],
    calloutBold: 'Real protection.',
    calloutText:
      "If our automated tests detect even a hint of bias, the code literally won't deploy. Fairness isn't optional here - it's built in.",
  },
  {
    id: 'oversight',
    toastTitle: 'Human Oversight',
    image: '/images/responsible-ai/human-oversight.svg',
    modalTitle: 'AI Recommends. You Decide.',
    modalIntro: 'Our AI is powerful, but it never makes final decisions on its own.',
    sectionTitle: 'How we keep humans in control:',
    sectionIntro: '',
    bullets: [
      'Pricing suggestions require your review and approval',
      'Our Responsible AI Council (legal, engineering, and customer success experts) oversees all high-risk features',
      'Every automated recommendation can be overridden by you',
    ],
    calloutBold: 'Your judgment matters.',
    calloutText: 'We design AI to augment your expertise, not replace it.',
  },
  {
    id: 'transparency',
    toastTitle: 'Transparency & Disclosure',
    image: '/images/responsible-ai/transparency-disclosure.svg',
    modalTitle: 'You Always Know When AI Is Working',
    modalIntro: "Transparency isn't just a buzzword at Proptii - it's a promise.",
    sectionTitle: 'What we do differently:',
    sectionIntro: '',
    bullets: [
      'When our chatbot assists tenants, they see a clear "AI Assistant" label',
      'Tenants can always request a human team member with one click',
      'Our AI only answers from verified sources: your lease agreements and property handbooks',
    ],
    calloutBold: 'No surprises.',
    calloutText: 'If our AI doesn\'t know something, it says "I don\'t know" rather than guessing.',
  },
  {
    id: 'privacy',
    toastTitle: 'Privacy Protection',
    image: '/images/responsible-ai/privacy-protection.svg',
    modalTitle: 'Your Data Stays Yours',
    modalIntro: "We never mix your business data with competitors' information.",
    sectionTitle: 'Our data protection approach:',
    sectionIntro: '',
    bullets: [
      'Each client\'s data is completely isolated — we call it "the clean room"',
      'Your lease information never trains models that benefit other properties',
      'We comply with GDPR and maintain strict data privacy controls',
    ],
    calloutBold: 'Competitive advantage preserved.',
    calloutText: 'Your proprietary information remains exactly that: yours.',
  },
  {
    id: 'monitoring',
    toastTitle: 'Continuous Monitoring',
    image: '/images/responsible-ai/continuous-monitoring.svg',
    modalTitle: 'We Watch Our AI Around the Clock',
    modalIntro: "Responsible AI isn't a one-time checkbox — it's continuous work.",
    sectionTitle: 'How we stay vigilant:',
    sectionIntro: '',
    bullets: [
      'Real-time monitoring detects if models drift toward bias as data changes',
      'Automated alerts notify our team immediately if fairness metrics slip',
      'Regular audits ensure our AI performs as intended, not just at launch but every day',
    ],
    calloutBold: 'Always improving.',
    calloutText:
      "We treat AI ethics like code quality: it's measured, monitored, and maintained constantly.",
  },
];

const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes between toasts
const LOCAL_STORAGE_KEY = 'proptii_rai_shown';
const MAX_PER_VISIT = 3;

const ResponsibleAIToast = () => {
  const [toastVisible, setToastVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [variant, setVariant] = useState<RAIVariant | null>(null);
  const [modalPage, setModalPage] = useState(0);
  const sessionShownCountRef = useRef(0);
  const doneRef = useRef(false);

  // Show the next unseen variant, or mark done if max shown
  const showNext = useCallback(() => {
    if (doneRef.current) return;

    if (sessionShownCountRef.current >= MAX_PER_VISIT) {
      doneRef.current = true;
      return;
    }

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const globallyShown: string[] = stored ? JSON.parse(stored) : [];

    const remaining = variants.filter((v) => !globallyShown.includes(v.id));
    if (remaining.length === 0) {
      doneRef.current = true;
      return;
    }

    const pick = remaining[0];
    const newGloballyShown = [...globallyShown, pick.id];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGloballyShown));
    sessionShownCountRef.current += 1;

    setVariant(pick);
    setToastVisible(true);

    if (newGloballyShown.length >= variants.length || sessionShownCountRef.current >= MAX_PER_VISIT) {
      doneRef.current = true;
    }
  }, []);

  // First toast after 1 minute, then every 3 minutes until max shown
  useEffect(() => {
    const firstTimer = setTimeout(() => {
      showNext();
    }, 60000);

    const interval = setInterval(() => {
      showNext();
    }, INTERVAL_MS);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [showNext]);

  // Auto-hide toast after 5s
  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  const hideToast = useCallback(() => setToastVisible(false), []);

  const openModal = useCallback(() => {
    hideToast();
    setModalPage(0);
    setModalVisible(true);
  }, [hideToast]);

  const closeModal = useCallback(() => setModalVisible(false), []);

  if (!variant) return null;

  const hasTwoPages = variant.id === 'fairness';
  const totalPages = hasTwoPages ? 2 : 1;

  return (
    <>
      {/* Toast */}
      <div
        className={`fixed top-5 right-5 z-[9000] w-[520px] max-w-[calc(100vw-24px)] bg-[#e9f4fa] font-['Nunito','Inter',sans-serif] border-b-[3px] border-b-[#2596be] rounded flex items-center px-5 py-4 gap-3.5 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300 ${
          toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2.5 pointer-events-none'
        }`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.rai-toast-close-btn')) return;
          openModal();
        }}
        role="alert"
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-[38px] h-[38px] border-2 border-[#2596be] rounded-full flex items-center justify-center text-[#2596be] text-lg font-bold italic font-serif">
          i
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="font-['Nunito',sans-serif] text-[15px] font-semibold text-[#2596be] mb-0.5">
            {variant.toastTitle}
          </div>
          <div className="text-[13px] text-[#5a7d8a]">How we safely use AI in our work</div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[13px] text-[#3a5a6a] whitespace-nowrap cursor-pointer hover:underline">
            Find out more
          </span>
          <div className="w-px h-5 bg-[#b0c4cc]" />
          <button
            className="rai-toast-close-btn bg-transparent border-none text-[22px] text-[#5a7d8a] cursor-pointer px-0.5 leading-none hover:text-[#2596be]"
            onClick={(e) => {
              e.stopPropagation();
              hideToast();
            }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9500] bg-black/70 transition-opacity duration-300 ${
          modalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeModal}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 z-[10000] w-[440px] max-w-[90vw] max-h-[90vh] bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden flex flex-col shadow-[0_8px_40px_rgba(0,0,0,0.12)] transition-all duration-300 ${
          modalVisible
            ? 'opacity-100 -translate-x-1/2 -translate-y-1/2 scale-100'
            : 'opacity-0 -translate-x-1/2 -translate-y-1/2 scale-95 pointer-events-none'
        }`}
      >
        {/* Close button */}
        <button
          className="absolute top-3.5 right-4 bg-transparent border-none text-[19px] text-[#2c3e50] cursor-pointer z-[2] leading-none font-light hover:text-black"
          onClick={closeModal}
          aria-label="Close"
        >
          &times;
        </button>

        {/* Body */}
        <div className="relative overflow-y-auto flex flex-col flex-1">
          <div className="px-9 pt-10 pb-6 flex flex-col items-center flex-1 relative">
            {/* Pagination arrows for Fairness First */}
            {hasTwoPages && modalPage > 0 && (
              <button
                className="absolute left-[-40px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[32px] text-[#c0c8d0] z-10 p-2 leading-none hover:text-[#5a6a7a]"
                onClick={(e) => { e.stopPropagation(); setModalPage(modalPage - 1); }}
                aria-label="Previous"
              >
                &#8249;
              </button>
            )}
            {hasTwoPages && modalPage < totalPages - 1 && (
              <button
                className="absolute right-[-40px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[32px] text-[#c0c8d0] z-10 p-2 leading-none hover:text-[#5a6a7a]"
                onClick={(e) => { e.stopPropagation(); setModalPage(modalPage + 1); }}
                aria-label="Next"
              >
                &#8250;
              </button>
            )}

            <h2 className="font-['Archivo',sans-serif] font-bold text-[16.2px] text-[#1a1a2e] mb-2 leading-snug text-center">
              {variant.modalTitle}
            </h2>
            <p className="font-['Inter',sans-serif] text-xs mb-5 text-[#5a6a7a] leading-relaxed text-center max-w-[260px]">
              {variant.modalIntro}
            </p>

            {/* Illustration */}
            <div className="flex justify-center items-center mb-5">
              {modalVisible && (
                <img
                  src={variant.image}
                  alt={`${variant.toastTitle} Illustration`}
                  className="w-[220px] h-auto"
                  style={{
                    animation: 'fadeScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, gentleFloat 3s ease-in-out 0.6s infinite',
                    opacity: 0,
                    transform: 'scale(0.7)',
                  }}
                />
              )}
            </div>

            {/* Content — changes with page for Fairness First */}
            {hasTwoPages && modalPage === 0 ? (
              <>
                <h3 className="font-['Archivo',sans-serif] font-bold text-[13px] text-[#1a1a2e] mb-3.5 text-center">
                  {variant.sectionTitle}
                </h3>
                <p className="font-['Inter',sans-serif] text-xs text-[#5a6a7a] leading-relaxed text-center">
                  {variant.sectionIntro}
                </p>
              </>
            ) : hasTwoPages && modalPage === 1 ? (
              <ul className="font-['Inter',sans-serif] list-disc pl-5 w-full self-start">
                {variant.bullets.map((b, i) => (
                  <li key={i} className="text-xs text-[#5a6a7a] leading-relaxed">
                    {b}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <h3 className="font-['Archivo',sans-serif] font-bold text-[13px] text-[#1a1a2e] mb-3.5 text-center">
                  {variant.sectionTitle}
                </h3>
                <ul className="font-['Inter',sans-serif] list-disc pl-5 w-full self-start">
                  {variant.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-[#5a6a7a] leading-relaxed">
                      {b}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Callout / footer */}
          <div className="border-t border-[#e8e8e8] px-9 py-5 text-xs text-[#5a6a7a] leading-relaxed font-['Inter',sans-serif] mt-auto">
            <strong className="font-bold text-[#1a1a2e] block mb-0.5">{variant.calloutBold}</strong>
            <p className="mb-3 mt-1">{variant.calloutText}</p>
            <Link
              to="/responsible-ai"
              className="text-[#2596be] no-underline font-semibold"
              onClick={closeModal}
            >
              Learn more about our approach &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeScaleIn {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </>
  );
};

export default ResponsibleAIToast;
