import React from 'react';
import { X, Download, ExternalLink, HelpCircle } from 'lucide-react';
import { Language } from '../utils/translations';

interface Props {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

const MANUAL_PATH = '/manual-guide.pdf';

export const HelpModal: React.FC<Props> = ({ lang, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {lang === 'id' ? 'Panduan Penggunaan Aplikasi' : 'Application User Guide'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'id' ? 'Manual lengkap cara menggunakan ThermoDuct' : 'Full manual for using ThermoDuct'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={MANUAL_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title={lang === 'id' ? 'Buka di tab baru' : 'Open in new tab'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {lang === 'id' ? 'Tab Baru' : 'New Tab'}
            </a>
            <a
              href={MANUAL_PATH}
              download="ThermoDuct_Manual_Guide.pdf"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title={lang === 'id' ? 'Unduh PDF' : 'Download PDF'}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'id' ? 'Unduh' : 'Download'}</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 bg-slate-950">
          <iframe
            src={`${MANUAL_PATH}#toolbar=1`}
            title="ThermoDuct Manual Guide"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
