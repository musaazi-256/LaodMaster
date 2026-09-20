import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import Logo from '../../components/identity/Logo';
import Button from '../../components/actions/Button';

export default function SplashScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  // RequireAuth redirects an unauthenticated /driver (or /customer) visit here with
  // `state: { from, role }` so Login can send them back to the right place afterward and
  // default to the right role tab. Landing on Splash by itself (not via a redirect) means
  // there's no such state, so `role` is simply undefined here — forwarding it either way
  // is what lets Login's `location.state?.role` fall through correctly in both cases.
  const { from, role } = location.state || {};
  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState('Initializing LoadMastr...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Connecting Uganda dispatch network...');
    }, 600);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Synchronizing driver & fleet data...');
    }, 1300);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Ready to move!');
      setIsReady(true);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="relative flex flex-col h-full min-h-0 bg-white text-neutral-900 overflow-hidden select-none">
      {/* Background Subtle Soft Green Ambient Glows */}
      <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-10 w-72 h-72 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #111827 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header Badge & Skip */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700">
          <Shield size={12} className="text-green-600" />
          <span>Uganda Logistics Platform</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/auth/login', { state: { from, role } })}
          className="text-[12px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors px-2 py-1"
        >
          Skip
        </button>
      </div>

      {/* Center Hero Section */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Pulsing Brand Logo Container */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full bg-green-500/15 animate-ping opacity-75" />
          <div className="absolute w-28 h-28 rounded-full bg-green-500/20 blur-md" />
          <div className="relative flex items-center justify-center w-28 h-24 rounded-3xl bg-white border border-neutral-200/80 shadow-card p-4">
            <Logo size="h-10" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="flex items-center gap-1.5 justify-center mb-1">
          <span className="text-[26px] font-black tracking-tight text-neutral-900 leading-none">
            LoadMastr
          </span>
          <span className="text-green-700 font-extrabold text-[12px] bg-green-100 px-2 py-0.5 rounded-md border border-green-200/80">
            V2
          </span>
        </div>
        <p className="text-[13.5px] font-bold text-green-700 tracking-wide max-w-[240px]">
          Move More. Go Further.
        </p>
        <p className="text-[11.5px] text-neutral-500 mt-1 max-w-[260px] leading-relaxed">
          Connecting Ugandan cargo owners with verified truck drivers in real-time.
        </p>

        {/* Loading Progress Bar */}
        <div className="w-full max-w-[240px] mt-8 flex flex-col items-center gap-2">
          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden p-[1px] border border-neutral-200/80">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
            {isReady ? (
              <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
            ) : (
              <Sparkles size={12} className="text-green-600 animate-spin flex-shrink-0" />
            )}
            <span>{statusText}</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="relative z-10 p-5 pt-3 flex flex-col gap-2.5 bg-white border-t border-neutral-200/80 shadow-2">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/auth/login', { state: { from, role } })}
          className="bg-green-500 hover:bg-green-600 text-white font-bold shadow-1 flex items-center justify-center gap-2 border-0"
        >
          <span>Get Started</span>
          <ArrowRight size={18} />
        </Button>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => navigate('/auth/signup', { state: { role } })}
            className="h-10 rounded-button bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-body-sm font-semibold transition-colors border border-neutral-200 flex items-center justify-center gap-1.5"
          >
            Create Account
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="h-10 rounded-button bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-body-sm font-semibold transition-colors border border-neutral-200 flex items-center justify-center gap-1.5"
          >
            Admin Console
          </button>
        </div>
      </div>
    </div>
  );
}
