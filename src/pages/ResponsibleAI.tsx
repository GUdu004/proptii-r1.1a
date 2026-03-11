import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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

/* SVG line-icons for each accordion trigger */
const SvgIcon = ({ id }: { id: string }) => {
  switch (id) {
    case 'fairness':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#FF6B35] fill-none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" /><path d="M5 7l7-4 7 4" /><path d="M5 7l-1 6h6L9 7" /><path d="M19 7l-1 6h-6l1-6" />
        </svg>
      );
    case 'oversight':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#FF6B35] fill-none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" /><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z" />
        </svg>
      );
    case 'transparency':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#FF6B35] fill-none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case 'privacy':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#FF6B35] fill-none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" /><path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'monitoring':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#FF6B35] fill-none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    default:
      return null;
  }
};

const ResponsibleAI = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative h-[80vh] bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: 'url("/images/FAQ-Hero.png")' }}
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/FAQ-Hero.png"
            alt="Responsible AI Hero"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#0A2342]/80" />
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Responsible AI</h1>
          <p className="text-xl text-white max-w-2xl">
            How we safely, fairly, and reliably use AI in our approach.
          </p>
        </div>
      </section>

      {/* Accordion Content */}
      <section
        className="py-16 relative bg-[#F8F9FB] scroll-mt-24"
        style={{
          backgroundImage: 'url("/images/Contract-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          backgroundColor: '#F8F9FB',
        }}
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/Contract-bg.png"
            alt="Background"
            className="w-full h-full object-cover"
            loading="lazy"
            sizes="100vw"
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="space-y-4">
            {variants.map((v) => {
              const isOpen = openSection === v.id;
              return (
                <div
                  key={v.id}
                  id={v.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden mb-4"
                >
                  {/* Trigger */}
                  <button
                    className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors duration-200 hover:bg-[#FDF8F3] ${
                      isOpen ? 'bg-[#FDF8F3]' : 'bg-white'
                    } ${
                      isOpen
                        ? 'border-t border-r border-b border-[#FF6B35]/20 border-l-4 border-l-[#FF6B35]'
                        : 'border border-transparent'
                    }`}
                    onClick={() => toggleSection(v.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isOpen ? 'bg-white' : 'bg-[#FDF8F3]'
                        }`}
                      >
                        <SvgIcon id={v.id} />
                      </div>
                      <span className="text-lg font-semibold text-[#1B3B5A] font-['Archivo',sans-serif]">
                        {v.toastTitle}
                      </span>
                    </div>
                    <div className="w-6 h-6 flex items-center justify-center text-[#FF6B35] text-2xl font-light select-none">
                      {isOpen ? '−' : '+'}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isOpen && (
                    <div className="px-6 py-6 bg-white border-b border-r border-l border-[#FF6B35]/20 rounded-b-lg animate-[slideDown_0.3s_ease-out]">
                      <div className="flex flex-col sm:flex-row gap-6 items-start">
                        {/* Illustration thumbnail with floating animation */}
                        <img
                          src={v.image}
                          alt={`${v.toastTitle} Illustration`}
                          className="w-[140px] h-auto flex-shrink-0 mt-2 animate-[fadeScaleIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards] sm:self-start self-center"
                          style={{ animationFillMode: 'forwards' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-[#1B3B5A] font-['Archivo',sans-serif] mb-2">
                            {v.modalTitle}
                          </h2>
                          <p className="text-[#4b5563] leading-relaxed text-[15px] mb-5">
                            {v.modalIntro}
                          </p>

                          <h3 className="font-semibold text-[#1B3B5A] mb-2 text-[15px]">
                            {v.sectionTitle}
                          </h3>
                          {v.sectionIntro && (
                            <p className="text-[#4b5563] leading-relaxed mb-3 text-sm">
                              {v.sectionIntro}
                            </p>
                          )}
                          <ul className="list-none pl-0 mb-5 space-y-2">
                            {v.bullets.map((b, i) => (
                              <li
                                key={i}
                                className="relative pl-5 text-[#4b5563] leading-relaxed text-sm before:content-['•'] before:text-[#FF6B35] before:font-bold before:absolute before:left-0 before:top-0"
                              >
                                {b}
                              </li>
                            ))}
                          </ul>

                          <div className="pt-4 border-t border-[#FF6B35]/20 text-sm text-[#4b5563] leading-relaxed">
                            <strong className="text-[#1B3B5A] font-bold block mb-1">
                              {v.calloutBold}
                            </strong>
                            {v.calloutText}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />

      {/* Keyframe animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeScaleIn {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-\\[fadeScaleIn_0\\.6s_cubic-bezier\\(0\\.34\\,1\\.56\\,0\\.64\\,1\\)_forwards\\] {
          animation: fadeScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     gentleFloat 3s ease-in-out 0.6s infinite;
        }
      `}</style>
    </div>
  );
};

export default ResponsibleAI;
