import React, { useState, useRef } from 'react';
import {
  Palette,
  Download,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Heart,
  Sliders,
  Printer,
  ChevronRight,
  Eye,
  Share2,
  Bookmark,
} from 'lucide-react';

interface CardTemplate {
  id: number;
  name: string;
  subtitle: string;
  badge: string;
  themeStyle: {
    bgGradient: string;
    cardBorder: string;
    innerBorder: string;
    accentColor: string;
    textColor: string;
    mutedColor: string;
    flourishColor: string;
    headerPill: string;
    isDark: boolean;
  };
}

const TEMPLATES: CardTemplate[] = [
  {
    id: 1,
    name: 'Template 1',
    subtitle: 'Royal Emerald Gold',
    badge: 'Royal Traditional',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#063328] via-[#0a4838] to-[#04281f]',
      cardBorder: 'border-[#d4af37]',
      innerBorder: 'border-[#d4af37]/60',
      accentColor: '#d4af37',
      textColor: 'text-[#fcf6ba]',
      mutedColor: 'text-[#d1fae5]',
      flourishColor: '#e6ca65',
      headerPill: 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#fcf6ba]',
      isDark: true,
    },
  },
  {
    id: 2,
    name: 'Template 2',
    subtitle: 'Regal Crimson Velvet',
    badge: 'Imperial Barat',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#4a0e17] via-[#661623] to-[#3a0810]',
      cardBorder: 'border-[#e6ca65]',
      innerBorder: 'border-[#e6ca65]/60',
      accentColor: '#e6ca65',
      textColor: 'text-amber-100',
      mutedColor: 'text-amber-200/90',
      flourishColor: '#fbbf24',
      headerPill: 'bg-amber-200 border-amber-300 text-red-950 font-bold',
      isDark: true,
    },
  },
  {
    id: 3,
    name: 'Template 3',
    subtitle: 'Floral Blush Rose',
    badge: 'Garden Romance',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#fdf6f0] via-[#faede8] to-[#f4ded4]',
      cardBorder: 'border-[#c89288]',
      innerBorder: 'border-[#c89288]/50',
      accentColor: '#9f5860',
      textColor: 'text-[#4a2e35]',
      mutedColor: 'text-[#7e525d]',
      flourishColor: '#9f5860',
      headerPill: 'bg-[#c89288]/20 border-[#c89288]/50 text-[#673841]',
      isDark: false,
    },
  },
  {
    id: 4,
    name: 'Template 4',
    subtitle: 'Midnight Sapphire & Silver',
    badge: 'Starlight Luxe',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#0b172a] via-[#15284f] to-[#0a1324]',
      cardBorder: 'border-[#94a3b8]',
      innerBorder: 'border-[#cbd5e1]/40',
      accentColor: '#e2e8f0',
      textColor: 'text-[#f8fafc]',
      mutedColor: 'text-[#cbd5e1]',
      flourishColor: '#94a3b8',
      headerPill: 'bg-[#94a3b8]/20 border-[#94a3b8]/40 text-[#f1f5f9]',
      isDark: true,
    },
  },
  {
    id: 5,
    name: 'Template 5',
    subtitle: 'Ivory Minimalist Luxe',
    badge: 'Modern Sophistication',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#faf8f5] via-[#f5f0e6] to-[#eae2d3]',
      cardBorder: 'border-[#8c7851]',
      innerBorder: 'border-[#8c7851]/40',
      accentColor: '#8c7851',
      textColor: 'text-[#2a241c]',
      mutedColor: 'text-[#635540]',
      flourishColor: '#8c7851',
      headerPill: 'bg-[#8c7851]/15 border-[#8c7851]/40 text-[#493e2e]',
      isDark: false,
    },
  },
  {
    id: 6,
    name: 'Template 6',
    subtitle: 'Golden Noor Arabesque',
    badge: 'Mughal Heritage',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#2b1f09] via-[#45320f] to-[#1f1604]',
      cardBorder: 'border-[#eab308]',
      innerBorder: 'border-[#eab308]/60',
      accentColor: '#facc15',
      textColor: 'text-[#fef9c3]',
      mutedColor: 'text-[#fef08a]/90',
      flourishColor: '#facc15',
      headerPill: 'bg-[#eab308]/20 border-[#eab308]/50 text-[#fef08a]',
      isDark: true,
    },
  },
  {
    id: 7,
    name: 'Template 7',
    subtitle: 'Pastel Lavender Dream',
    badge: 'Ethereal Grace',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#faf5ff] via-[#f3e8ff] to-[#e9d5ff]',
      cardBorder: 'border-[#a855f7]',
      innerBorder: 'border-[#a855f7]/40',
      accentColor: '#7e22ce',
      textColor: 'text-[#3b0764]',
      mutedColor: 'text-[#6b21a8]',
      flourishColor: '#9333ea',
      headerPill: 'bg-[#a855f7]/20 border-[#a855f7]/40 text-[#581c87]',
      isDark: false,
    },
  },
  {
    id: 8,
    name: 'Template 8',
    subtitle: 'Marigold Festive Mehndi',
    badge: 'Mehndi Utsav',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#451a03] via-[#78350f] to-[#361302]',
      cardBorder: 'border-[#f59e0b]',
      innerBorder: 'border-[#f59e0b]/60',
      accentColor: '#fbbf24',
      textColor: 'text-[#fef3c7]',
      mutedColor: 'text-[#fed7aa]',
      flourishColor: '#f59e0b',
      headerPill: 'bg-[#f59e0b]/20 border-[#f59e0b]/50 text-[#fef3c7]',
      isDark: true,
    },
  },
  {
    id: 9,
    name: 'Template 9',
    subtitle: 'Champagne Pearl Elegance',
    badge: 'Subtle Grandeur',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#f8f5ee] via-[#efe8da] to-[#dfd5c2]',
      cardBorder: 'border-[#b8a17d]',
      innerBorder: 'border-[#b8a17d]/50',
      accentColor: '#8a7452',
      textColor: 'text-[#372f22]',
      mutedColor: 'text-[#6c5c44]',
      flourishColor: '#9e8561',
      headerPill: 'bg-[#b8a17d]/20 border-[#b8a17d]/40 text-[#544633]',
      isDark: false,
    },
  },
  {
    id: 10,
    name: 'Template 10',
    subtitle: 'Imperial Burgundy',
    badge: 'Noble Walima',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#3b0d23] via-[#581534] to-[#290717]',
      cardBorder: 'border-[#d4af37]',
      innerBorder: 'border-[#d4af37]/50',
      accentColor: '#d4af37',
      textColor: 'text-[#fef08a]',
      mutedColor: 'text-[#fbcfe8]',
      flourishColor: '#fbbf24',
      headerPill: 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#fef08a]',
      isDark: true,
    },
  },
  {
    id: 11,
    name: 'Template 11',
    subtitle: 'Celestial Navy Gold',
    badge: 'Grand Ballroom',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a]',
      cardBorder: 'border-[#e2b714]',
      innerBorder: 'border-[#e2b714]/60',
      accentColor: '#e2b714',
      textColor: 'text-[#fef9c3]',
      mutedColor: 'text-[#cbd5e1]',
      flourishColor: '#e2b714',
      headerPill: 'bg-[#e2b714]/20 border-[#e2b714]/40 text-[#fef9c3]',
      isDark: true,
    },
  },
  {
    id: 12,
    name: 'Template 12',
    subtitle: 'Rose Gold Romance',
    badge: 'Vintage Sheen',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#2d1217] via-[#481c25] to-[#250d12]',
      cardBorder: 'border-[#f472b6]',
      innerBorder: 'border-[#f472b6]/50',
      accentColor: '#f472b6',
      textColor: 'text-[#fce7f3]',
      mutedColor: 'text-[#fbcfe8]',
      flourishColor: '#f472b6',
      headerPill: 'bg-[#f472b6]/20 border-[#f472b6]/40 text-[#fce7f3]',
      isDark: true,
    },
  },
  {
    id: 13,
    name: 'Template 13',
    subtitle: 'Antique Bronze Damask',
    badge: 'Heritage Estate',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#1c1917] via-[#292524] to-[#141210]',
      cardBorder: 'border-[#ca8a04]',
      innerBorder: 'border-[#ca8a04]/50',
      accentColor: '#ca8a04',
      textColor: 'text-[#fef08a]',
      mutedColor: 'text-[#d6d3d1]',
      flourishColor: '#eab308',
      headerPill: 'bg-[#ca8a04]/20 border-[#ca8a04]/40 text-[#fef08a]',
      isDark: true,
    },
  },
  {
    id: 14,
    name: 'Template 14',
    subtitle: 'Opal White Classic',
    badge: 'Timeless Monochrome',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#f1f5f9]',
      cardBorder: 'border-[#334155]',
      innerBorder: 'border-[#334155]/40',
      accentColor: '#0f172a',
      textColor: 'text-[#0f172a]',
      mutedColor: 'text-[#475569]',
      flourishColor: '#334155',
      headerPill: 'bg-[#334155]/10 border-[#334155]/30 text-[#0f172a]',
      isDark: false,
    },
  },
  {
    id: 15,
    name: 'Template 15',
    subtitle: 'Sunset Amber Glow',
    badge: 'Festive Shehnai',
    themeStyle: {
      bgGradient: 'bg-gradient-to-b from-[#431407] via-[#7c2d12] to-[#371005]',
      cardBorder: 'border-[#fb923c]',
      innerBorder: 'border-[#fb923c]/60',
      accentColor: '#fb923c',
      textColor: 'text-[#ffedd5]',
      mutedColor: 'text-[#fdba74]',
      flourishColor: '#fb923c',
      headerPill: 'bg-[#fb923c]/20 border-[#fb923c]/40 text-[#ffedd5]',
      isDark: true,
    },
  },
];

export const CardStudioModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // Form starts with completely empty state and structural placeholders
  const [eventType, setEventType] = useState('');
  const [hostName, setHostName] = useState('');
  const [names, setNames] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Selected Template (default to Regal Crimson Velvet template)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(2);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const currentTemplate =
    TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

  const handleReset = () => {
    setEventType('');
    setHostName('');
    setNames('');
    setEventDate('');
    setEventTime('');
    setVenueName('');
    setCustomMessage('');
  };

  // WhatsApp formatted invitation message
  const generateInviteMessage = () => {
    const formattedDate = eventDate || '[Enter Date]';
    const formattedTime = eventTime || '[Enter Time]';
    const formattedHost = hostName.trim() || '[Enter Host Name]';
    const formattedNames = names.trim() || '[Enter Names]';
    const formattedVenue = venueName.trim() || '[Enter Hall/Venue Name]';
    const formattedType = eventType || '[Event Type]';
    const formattedMsg = customMessage.trim()
      ? `\n"${customMessage.trim()}"\n`
      : '';

    return (
      `﷽\n` +
      `*ROYAL WEDDING INVITATION*\n` +
      `═════════════════════════\n\n` +
      `Cordially invited by:\n` +
      `*${formattedHost}*\n\n` +
      `To celebrate the auspicious occasion of:\n` +
      `*${formattedType}*\n\n` +
      `In honour of:\n` +
      `✨ *${formattedNames}* ✨\n\n` +
      `📅 *Date:* ${formattedDate}\n` +
      `⏰ *Time:* ${formattedTime}\n` +
      `🏛️ *Venue:* ${formattedVenue}\n` +
      `${formattedMsg}\n` +
      `Looking forward to welcoming you and celebrating together.\n` +
      `R.S.V.P: [Family & Friends]`
    );
  };

  const handleSendWhatsApp = () => {
    const text = generateInviteMessage();
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = () => {
    const text = generateInviteMessage();
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const handlePrintOrPdf = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Print Specific CSS to isolate the Wedding Card for high-resolution PDF printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #wedding-card-print-area, #wedding-card-print-area * {
            visibility: visible !important;
          }
          #wedding-card-print-area {
            position: absolute !important;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 100% !important;
            max-width: 520px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Section: Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-50 text-[#00685f]">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Wedding Card Studio
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Design and generate beautiful event invitations for clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Reset form placeholders"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Copy invitation message to clipboard"
          >
            {copiedNotification ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Invite Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow-md"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Send via WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrintOrPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00685f] hover:bg-[#00524a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Layout: 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Form ("Card Customization") */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00685f]" />
              <h2 className="text-base font-bold text-slate-800">Card Customization</h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
              Live Synchronized
            </span>
          </div>

          <div className="space-y-4">
            {/* Field 1: Event Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all"
              >
                <option value="">[Select Event Type]</option>
                <option value="Barat">Barat</option>
                <option value="Walima">Walima</option>
                <option value="Mehndi">Mehndi</option>
                <option value="Qawwali Night">Qawwali Night</option>
                <option value="Engagement">Engagement</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Field 2: Host / Family Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Host / Family Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="[Enter Host Name]"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all"
              />
            </div>

            {/* Field 3: Groom / Bride Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Groom / Bride Name
              </label>
              <input
                type="text"
                value={names}
                onChange={(e) => setNames(e.target.value)}
                placeholder="[Enter Names]"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: Enter both names separated by &apos;&amp;&apos; or &apos;w/o&apos; (e.g., [Groom Name] &amp; [Bride Name])
              </p>
            </div>

            {/* Field 4 & 5: Event Date & Event Time in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Event Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full pl-3.5 pr-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Event Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full pl-3.5 pr-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Field 6: Venue Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Venue Name
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="[Enter Hall/Venue Name]"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all"
              />
            </div>

            {/* Field 7: Custom Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Custom Message
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="[Enter a short welcome message]"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all resize-none"
              />
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-2.5 mt-2">
            <Sparkles className="w-4 h-4 text-[#00685f] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">Strict Data Integrity:</span> Form fields render live onto the preview canvas below. Unfilled values automatically show professional placeholders like <span className="font-mono text-slate-600">[Enter Names]</span>.
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview ("Live Preview") */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#00685f]" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Live Preview
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                A5 Portrait Format
              </span>
              <span className="text-[11px] font-semibold text-[#00685f] bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full">
                {currentTemplate.name}: {currentTemplate.subtitle}
              </span>
            </div>
          </div>

          {/* Elegant A5-style vertical card placeholder with luxury wedding vibe */}
          <div className="w-full flex justify-center items-center py-2">
            <div
              id="wedding-card-print-area"
              ref={cardRef}
              className={`relative w-full max-w-[460px] min-h-[620px] rounded-2xl ${currentTemplate.themeStyle.bgGradient} p-6 sm:p-8 transition-all duration-300 shadow-2xl flex flex-col justify-between border-4 ${currentTemplate.themeStyle.cardBorder}`}
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              {/* Outer Corner Ornaments */}
              <div
                className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2"
                style={{ borderColor: currentTemplate.themeStyle.accentColor }}
              />
              <div
                className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2"
                style={{ borderColor: currentTemplate.themeStyle.accentColor }}
              />
              <div
                className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2"
                style={{ borderColor: currentTemplate.themeStyle.accentColor }}
              />
              <div
                className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2"
                style={{ borderColor: currentTemplate.themeStyle.accentColor }}
              />

              {/* Inner Decorative Inset Border */}
              <div
                className={`absolute inset-3.5 sm:inset-4 rounded-xl border border-dashed ${currentTemplate.themeStyle.innerBorder} pointer-events-none`}
              />

              {/* Card Content Interior */}
              <div className="relative z-10 flex flex-col h-full justify-between items-center text-center px-1 py-1 gap-2.5">
                {/* 1. Header: Bismillah / Islamic Blessing - Fully visible on all screens */}
                <div className="w-full text-center px-4 flex flex-col items-center">
                  <div
                    dir="rtl"
                    className="w-full text-center px-4 text-sm sm:text-base md:text-lg font-serif tracking-normal leading-relaxed select-none text-amber-200 drop-shadow-sm whitespace-normal"
                    style={{ color: currentTemplate.themeStyle.isDark ? '#fef08a' : currentTemplate.themeStyle.flourishColor }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </div>
                  <div
                    className={`text-[9px] sm:text-[10px] tracking-[0.25em] uppercase font-sans font-semibold mt-1 ${
                      currentTemplate.themeStyle.isDark ? 'text-amber-200/90' : 'text-slate-600'
                    }`}
                  >
                    IN THE NAME OF ALLAH, THE MOST BENEFICENT &amp; MERCIFUL
                  </div>

                  {/* Ornamental filigree divider */}
                  <div className="flex items-center gap-2 my-1.5 w-36 justify-center opacity-85">
                    <span
                      className="h-px flex-1"
                      style={{ backgroundColor: currentTemplate.themeStyle.accentColor }}
                    />
                    <span
                      className="text-xs text-amber-200"
                    >
                      ✦
                    </span>
                    <span
                      className="h-px flex-1"
                      style={{ backgroundColor: currentTemplate.themeStyle.accentColor }}
                    />
                  </div>
                </div>

                {/* 2. Host Section */}
                <div className="flex flex-col items-center max-w-[90%] my-0.5">
                  <span
                    className={`text-xs sm:text-sm tracking-wider uppercase font-sans font-semibold mb-1 ${
                      currentTemplate.themeStyle.isDark ? 'text-amber-200' : 'text-slate-600'
                    }`}
                  >
                    Cordially Invite You To Grace
                  </span>

                  <h3
                    className={`text-lg sm:text-xl font-bold tracking-normal italic transition-all ${
                      hostName.trim()
                        ? currentTemplate.themeStyle.isDark
                          ? 'text-amber-50 drop-shadow-sm'
                          : currentTemplate.themeStyle.textColor
                        : currentTemplate.themeStyle.isDark
                        ? 'text-amber-200/60 font-mono text-sm not-italic'
                        : 'opacity-40 italic font-mono text-sm'
                    }`}
                  >
                    {hostName.trim() ? hostName : '[Enter Host Name]'}
                  </h3>

                  <p
                    className={`text-[11px] sm:text-xs font-sans tracking-wide mt-1 ${
                      currentTemplate.themeStyle.isDark ? 'text-amber-100/90' : 'text-slate-600/80'
                    }`}
                  >
                    requests the honour of your benign presence at the
                  </p>
                </div>

                {/* 3. Event Type Ribbon / Badge - High contrast bg-amber-200 and text-red-950 */}
                <div className="flex flex-col items-center my-0.5">
                  <span
                    className="px-5 py-1.5 rounded-full text-xs sm:text-sm font-sans font-bold tracking-[0.2em] uppercase bg-amber-200 text-red-950 border border-amber-300 shadow-sm"
                  >
                    {eventType.trim() ? eventType : '[Event Type]'}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-widest font-sans mt-1 font-semibold ${
                      currentTemplate.themeStyle.isDark ? 'text-amber-200' : 'text-slate-600'
                    }`}
                  >
                    Celebration
                  </span>
                </div>

                {/* 4. Couple Names (Central Hero) with drop-shadow and bright text-amber-50 */}
                <div className="flex flex-col items-center max-w-[95%] my-0.5">
                  <h1
                    className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight text-center leading-snug drop-shadow-sm transition-all ${
                      names.trim()
                        ? currentTemplate.themeStyle.isDark
                          ? 'text-amber-50 drop-shadow-sm'
                          : currentTemplate.themeStyle.textColor
                        : currentTemplate.themeStyle.isDark
                        ? 'text-amber-200/60 italic font-mono text-base'
                        : 'opacity-40 italic font-mono text-base'
                    }`}
                  >
                    {names.trim() ? names : '[Enter Names]'}
                  </h1>

                  {/* Central Flourish Icon */}
                  <div className="flex items-center gap-3 my-1.5 opacity-85">
                    <span
                      className="w-10 h-px"
                      style={{ backgroundColor: currentTemplate.themeStyle.accentColor }}
                    />
                    <Heart
                      className="w-3.5 h-3.5 fill-current"
                      style={{ color: currentTemplate.themeStyle.accentColor }}
                    />
                    <span
                      className="w-10 h-px"
                      style={{ backgroundColor: currentTemplate.themeStyle.accentColor }}
                    />
                  </div>
                </div>

                {/* 5. Custom Welcome Message / Note with bright text-amber-100 */}
                <div className="max-w-[85%] text-center my-0.5">
                  <p
                    className={`text-xs sm:text-sm italic font-serif leading-relaxed line-clamp-2 ${
                      customMessage.trim()
                        ? currentTemplate.themeStyle.isDark
                          ? 'text-amber-100 drop-shadow-2xs font-medium'
                          : currentTemplate.themeStyle.mutedColor
                        : currentTemplate.themeStyle.isDark
                        ? 'text-amber-200/60 italic font-mono text-[11px]'
                        : 'opacity-35 italic font-mono text-[11px]'
                    }`}
                  >
                    {customMessage.trim()
                      ? `"${customMessage}"`
                      : '"[Enter a short welcome message]"'}
                  </p>
                </div>

                {/* 6. Event Timing & Venue Box - High contrast text-amber-100 and text-amber-200 */}
                <div
                  className="w-full max-w-[90%] rounded-xl p-3 sm:p-3.5 backdrop-blur-xs border transition-all my-1"
                  style={{
                    backgroundColor: currentTemplate.themeStyle.isDark
                      ? 'rgba(0, 0, 0, 0.4)'
                      : 'rgba(255, 255, 255, 0.65)',
                    borderColor: currentTemplate.themeStyle.isDark
                      ? 'rgba(253, 230, 138, 0.4)'
                      : `${currentTemplate.themeStyle.accentColor}40`,
                  }}
                >
                  <div
                    className="grid grid-cols-2 gap-3 text-center border-b pb-2.5 mb-2.5"
                    style={{
                      borderColor: currentTemplate.themeStyle.isDark
                        ? 'rgba(253, 230, 138, 0.3)'
                        : `${currentTemplate.themeStyle.accentColor}25`,
                    }}
                  >
                    {/* Date */}
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center gap-1.5 text-[11px] font-sans font-bold uppercase tracking-wider ${
                        currentTemplate.themeStyle.isDark ? 'text-amber-200' : 'text-slate-700'
                      }`}>
                        <Calendar className={`w-3.5 h-3.5 ${currentTemplate.themeStyle.isDark ? 'text-yellow-300' : 'text-slate-600'}`} />
                        <span>Date</span>
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-semibold font-serif mt-1 ${
                          eventDate
                            ? currentTemplate.themeStyle.isDark
                              ? 'text-amber-100 font-bold'
                              : currentTemplate.themeStyle.textColor
                            : currentTemplate.themeStyle.isDark
                            ? 'text-amber-200/60 font-mono text-[11px]'
                            : 'opacity-40 font-mono text-[11px]'
                        }`}
                      >
                        {eventDate ? eventDate : '[Enter Date]'}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center gap-1.5 text-[11px] font-sans font-bold uppercase tracking-wider ${
                        currentTemplate.themeStyle.isDark ? 'text-amber-200' : 'text-slate-700'
                      }`}>
                        <Clock className={`w-3.5 h-3.5 ${currentTemplate.themeStyle.isDark ? 'text-yellow-300' : 'text-slate-600'}`} />
                        <span>Time</span>
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-semibold font-serif mt-1 ${
                          eventTime
                            ? currentTemplate.themeStyle.isDark
                              ? 'text-amber-100 font-bold'
                              : currentTemplate.themeStyle.textColor
                            : currentTemplate.themeStyle.isDark
                            ? 'text-amber-200/60 font-mono text-[11px]'
                            : 'opacity-40 font-mono text-[11px]'
                        }`}
                      >
                        {eventTime ? eventTime : '[Enter Time]'}
                      </span>
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`flex items-center gap-1.5 text-[11px] font-sans font-bold uppercase tracking-widest ${
                      currentTemplate.themeStyle.isDark ? 'text-amber-200' : 'text-slate-700'
                    }`}>
                      <MapPin className={`w-3.5 h-3.5 ${currentTemplate.themeStyle.isDark ? 'text-yellow-300' : 'text-slate-600'}`} />
                      <span>Venue</span>
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-serif font-bold tracking-normal line-clamp-1 mt-1 ${
                        venueName.trim()
                          ? currentTemplate.themeStyle.isDark
                            ? 'text-amber-100'
                            : currentTemplate.themeStyle.textColor
                          : currentTemplate.themeStyle.isDark
                          ? 'text-amber-200/60 font-mono text-[11px]'
                          : 'opacity-40 font-mono text-[11px]'
                      }`}
                    >
                      {venueName.trim() ? venueName : '[Enter Hall/Venue Name]'}
                    </span>
                  </div>
                </div>

                {/* 7. Footer RSVP / Compliments */}
                <div className={`w-full flex justify-between items-center text-[9px] sm:text-[10px] font-sans tracking-widest uppercase px-3 font-semibold ${
                  currentTemplate.themeStyle.isDark ? 'text-amber-200/90' : 'text-slate-600/80'
                }`}>
                  <span>R.S.V.P: [Family &amp; Friends]</span>
                  <span>With Best Compliments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: "Choose a Template" (15 Template Placeholders) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00685f]" />
              <span>Choose a Template</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select from 15 curated royal event designs, gradients, and decorative border styles.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Selected:</span>
            <span className="font-bold text-[#00685f] px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200">
              {currentTemplate.name} — {currentTemplate.subtitle}
            </span>
          </div>
        </div>

        {/* Responsive Grid of 15 Template Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`relative group flex flex-col text-left rounded-xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#00685f] ring-2 ring-[#00685f]/30 bg-teal-50/20 shadow-md transform -translate-y-0.5'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70 hover:shadow-xs'
                }`}
              >
                {/* Visual Thumbnail representing template styling */}
                <div
                  className={`relative w-full aspect-[4/3] rounded-lg ${tmpl.themeStyle.bgGradient} border-2 ${tmpl.themeStyle.cardBorder} flex flex-col items-center justify-center p-2 overflow-hidden shadow-inner mb-2.5`}
                >
                  <div
                    className="text-xs font-serif opacity-80"
                    style={{ color: tmpl.themeStyle.flourishColor }}
                  >
                    ﷽
                  </div>
                  <div
                    className="text-[9px] font-serif font-bold tracking-wider mt-0.5"
                    style={{ color: tmpl.themeStyle.accentColor }}
                  >
                    [Event Card]
                  </div>
                  <div
                    className="w-8 h-px mt-1 opacity-50"
                    style={{ backgroundColor: tmpl.themeStyle.accentColor }}
                  />

                  {/* Selected Checkmark Badge */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#00685f] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Template Meta Info */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      #{tmpl.id.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                    {tmpl.subtitle}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: tmpl.themeStyle.accentColor }}
                    />
                    <span className="truncate">{tmpl.badge}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
