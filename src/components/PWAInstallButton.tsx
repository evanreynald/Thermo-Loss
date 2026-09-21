import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  lang?: 'id' | 'en';
}

export const PWAInstallButton: React.FC<Props> = ({ lang = 'id' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const labelInstall = lang === 'id' ? 'Install Aplikasi' : 'Install App';
  const labelIos = lang === 'id' ? 'Pasang di iOS' : 'Install on iOS';

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all active:scale-95 border border-blue-400/30"
        title={lang === 'id' ? 'Install ThermoDuct sebagai aplikasi native di HP / Desktop' : 'Install ThermoDuct as a native app on Mobile / Desktop'}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{labelInstall}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>{labelIos}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  {lang === 'id' ? 'Pasang di iPhone / iPad' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                {lang === 'id' ? (
                  <>
                    1. Buka halaman ini di browser <strong>Safari</strong>.<br />
                    2. Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di bilah bawah.<br />
                    3. Gulir ke bawah dan pilih <strong>"Add to Home Screen" (Tambah ke Layar Utama)</strong>.
                  </>
                ) : (
                  <>
                    1. Open this page in <strong>Safari</strong>.<br />
                    2. Tap the <strong>Share</strong> icon in the bottom toolbar.<br />
                    3. Scroll down and select <strong>"Add to Home Screen"</strong>.
                  </>
                )}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-500 py-2 text-xs font-semibold text-white transition"
              >
                {lang === 'id' ? 'Mengerti' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback indicator button for desktop/mobile browsers that haven't fired prompt yet
  return (
    <button
      onClick={() => {
        alert(
          lang === 'id'
            ? 'Aplikasi ThermoDuct PWA siap dipasang! Gunakan browser Chrome/Edge di HP atau Desktop, lalu ketuk ikon "Install" di address bar atau menu titik tiga browser.'
            : 'ThermoDuct PWA is install-ready! Use Chrome/Edge on Mobile or Desktop and click the "Install" icon in your address bar.'
        );
      }}
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition"
      title="PWA Ready"
    >
      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
      <span>PWA Ready</span>
    </button>
  );
};
