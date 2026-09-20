import { useState, useEffect, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppState } from '../../state/AppStateContext';
import { LiveDemoDeviceContext } from '../LiveDemo';
import DeviceStatusBar from '../../components/demo/DeviceStatusBar';
import DeviceToggle from '../../components/demo/DeviceToggle';

export default function PhoneFrame({ showToggleHeader = true, overridePlatform }) {
  const { devicePlatform, setDevicePlatform } = useAppState();
  const liveDemoCtx = useContext(LiveDemoDeviceContext);

  const currentPlatform = overridePlatform || liveDemoCtx?.platform || devicePlatform || 'ios';
  const handleSelectPlatform = liveDemoCtx?.setPlatform || setDevicePlatform;

  // Responsive mode: on actual small mobile screens (window width < 768px), default to native full view.
  const [viewMode, setViewMode] = useState(() => (window.innerWidth < 768 ? 'full' : 'framed'));

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768 && viewMode === 'framed') {
        setViewMode('full');
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Frameless Native Mobile View for Exported App / Mobile Devices
  if (viewMode === 'full') {
    return (
      <div className="w-full min-h-screen bg-neutral-50 flex flex-col antialiased relative overflow-x-hidden">
        {/* Subtle toggle float for quick desktop testing when full mode is selected */}
        {showToggleHeader && window.innerWidth >= 768 && (
          <div className="fixed top-3 right-3 z-50">
            <DeviceToggle
              platform={currentPlatform}
              onSelectPlatform={handleSelectPlatform}
              viewMode={viewMode}
              onToggleViewMode={() => setViewMode('framed')}
            />
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-0 w-full">
          <Outlet />
        </div>
      </div>
    );
  }

  // Rigid Non-Responsive Frame Mockup for Browser Demo View
  // iOS Specs: 393px width, 852px height (iPhone 15 Pro standard ratio)
  // Android Specs: 412px width, 892px height (Pixel 8 standard ratio)
  const isIos = currentPlatform === 'ios';
  const frameWidth = isIos ? '393px' : '412px';
  const frameHeight = isIos ? '852px' : '892px';
  const frameRadius = isIos ? 'rounded-[44px]' : 'rounded-[32px]';
  const frameBorder = isIos ? 'border-[10px] border-neutral-900 ring-1 ring-neutral-800' : 'border-[10px] border-neutral-800 ring-1 ring-neutral-700';

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center py-6 px-4 select-none">
      {/* Top Demo Header Toggle Bar (Shown when viewing standalone routes like /customer or /driver) */}
      {showToggleHeader && !liveDemoCtx && (
        <div className="mb-4 flex items-center justify-between w-full max-w-[430px] px-2">
          <span className="text-small font-medium text-neutral-500 uppercase tracking-wider">
            {isIos ? ' iPhone View' : '🤖 Android View'}
          </span>
          <DeviceToggle
            platform={currentPlatform}
            onSelectPlatform={handleSelectPlatform}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode('full')}
          />
        </div>
      )}

      {/* FIXED, NON-RESPONSIVE PHONE FRAME */}
      {/* Does NOT change size, collapse, expand or hug content when child screen content changes */}
      <div
        className={`relative ${frameRadius} ${frameBorder} bg-neutral-900 shadow-3 overflow-hidden flex flex-col flex-shrink-0 transition-all duration-standard`}
        style={{
          width: frameWidth,
          height: frameHeight,
          minWidth: frameWidth,
          maxWidth: frameWidth,
          minHeight: frameHeight,
          maxHeight: frameHeight,
        }}
      >
        {/* Scrollable Screen Content Container (Locked Frame Dimensions) */}
        <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden no-scrollbar relative w-full h-full">
          {/* Platform Authentic Top Status Bar (Transparent Overlay) */}
          <DeviceStatusBar platform={currentPlatform} transparent />

          <Outlet />

          {/* Platform Bottom Navigation / Gesture Bar */}
          <div className="w-full bg-transparent py-1.5 flex justify-center items-center flex-shrink-0 z-30 absolute bottom-0 inset-x-0 pointer-events-none">
            {isIos ? (
              <div className="w-32 h-1 bg-neutral-900 rounded-full opacity-80" />
            ) : (
              <div className="w-24 h-1 bg-neutral-700 rounded-full opacity-60" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
