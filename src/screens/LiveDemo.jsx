import { createContext, useContext, useState } from 'react';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import {
  ExternalLink,
  Smartphone,
  Gauge,
  Monitor,
  ChevronRight,
  Lightbulb,
  FileText,
  Sparkles,
  Truck,
  Minus,
  Plus,
} from 'lucide-react';
import { authRoutes, customerRoutes, driverRoutes } from '../routes/routeGroups';
import { AppStateProvider } from '../state/AppStateContext';
import { createMemorySession } from '../state/session';
import Logo from '../components/identity/Logo';
import DeviceToggle from '../components/demo/DeviceToggle';
import { cx } from '../lib/cx';

export const LiveDemoDeviceContext = createContext(null);

export function useLiveDemoDevice() {
  return useContext(LiveDemoDeviceContext);
}

// Lets screens rendered inside the Live Demo (e.g. RequestEntry's nearby-trucks map) read the
// simulation controls above the phone panes, without prop-drilling them through every route.
// `null` outside Live Demo, so consumers fall back to their own defaults.
export const LiveDemoSimContext = createContext(null);

export function useLiveDemoSim() {
  return useContext(LiveDemoSimContext);
}

function CustomerPaneRoutes() {
  return useRoutes([...authRoutes, ...customerRoutes]);
}

function DriverPaneRoutes() {
  return useRoutes([...authRoutes, ...driverRoutes]);
}

export default function LiveDemo() {
  const [customerSession] = useState(() => createMemorySession());
  const [driverSession] = useState(() => createMemorySession());
  const [demoPlatform, setDemoPlatform] = useState('ios');
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'driver' | 'splash'

  const [customerRoute, setCustomerRoute] = useState('/splash');
  const [customerKey, setCustomerKey] = useState(0);

  const [driverRoute, setDriverRoute] = useState('/splash');
  const [driverKey, setDriverKey] = useState(0);

  // Map simulation controls, shared above both phone panes — currently only the Customer
  // pane's "nearby trucks" idle-state map reads these, but they're exposed to both in case
  // future demo screens want them too.
  const [nearbyTruckCount, setNearbyTruckCount] = useState(3);
  const [truckStatusMix, setTruckStatusMix] = useState('available'); // 'available' | 'mixed'

  function setCustomerPath(path) {
    setCustomerRoute(path);
    setCustomerKey((k) => k + 1);
  }

  function setDriverPath(path) {
    setDriverRoute(path);
    setDriverKey((k) => k + 1);
  }

  return (
    <LiveDemoDeviceContext.Provider value={{ platform: demoPlatform, setPlatform: setDemoPlatform }}>
    <LiveDemoSimContext.Provider value={{ nearbyTruckCount, setNearbyTruckCount, truckStatusMix, setTruckStatusMix }}>
      <div className="min-h-screen bg-white flex flex-col antialiased">
        {/* TOP HEADER NAVBAR */}
        <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-1">
          <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between gap-6">
            {/* Logo */}
            <a href="/" className="flex items-center group">
              <Logo size="h-9" showTagline />
            </a>

            {/* Center Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-body-sm font-medium">
              <span className="text-green-700 font-bold border-b-2 border-green-500 pb-1 cursor-default">
                Live Demo
              </span>
              <a href="/style-guide" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                Features
              </a>
              <a href="/style-guide" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                Screens
              </a>
              <a href="/style-guide" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                Design System
              </a>
              <a href="/" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                About
              </a>
            </nav>

            {/* Right Side Controls */}
            <div className="flex items-center gap-4">
              <DeviceToggle
                platform={demoPlatform}
                onSelectPlatform={setDemoPlatform}
                showLabel={true}
              />

              <a
                href="/admin"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-button border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 font-medium text-body-sm shadow-1 transition-all"
              >
                <ExternalLink size={15} />
                <span>Open Admin</span>
              </a>
            </div>
          </div>
        </header>

        {/* MAIN BODY SPLIT LAYOUT */}
        <div className="flex-1 max-w-[1440px] w-full mx-auto flex flex-col md:flex-row items-stretch">
          {/* LEFT SIDEBAR PANEL (~30% width) */}
          <aside className="w-full md:w-[380px] lg:w-[400px] p-8 flex flex-col bg-white border-r border-neutral-200 flex-shrink-0">
            {/* Category Subtitle */}
            <span className="text-[11px] font-bold uppercase tracking-wider text-green-700 mb-1">
              INTERACTIVE DEMO
            </span>

            {/* Main Headline */}
            <h1 className="text-[32px] font-bold text-neutral-900 leading-tight">
              Try the LoadMastr apps
            </h1>

            {/* Intro Description */}
            <p className="text-body-sm text-neutral-500 leading-relaxed mt-2">
              Explore real user flows for customers and drivers. This is a clickable prototype showing the key screens and interactions.
            </p>

            {/* Horizontal Line Accent */}
            <div className="w-8 h-[2px] bg-neutral-200 my-5" />

            {/* App Navigation Cards */}
            <div className="flex flex-col gap-3">
              {/* Splash Screen Card */}
              <div
                onClick={() => {
                  setActiveTab('splash');
                  setCustomerPath('/splash');
                  setDriverPath('/splash');
                }}
                className={cx(
                  'p-4 rounded-card border flex items-center justify-between cursor-pointer transition-all duration-fast',
                  activeTab === 'splash'
                    ? 'bg-green-50/80 border-green-300 text-neutral-900 shadow-1'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60'
                )}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={cx(
                      'flex h-11 w-11 items-center justify-center rounded-button transition-colors',
                      activeTab === 'splash' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h3 className="text-body font-semibold text-neutral-900">Splash Screen</h3>
                    <p className="text-small text-neutral-500">App Launch & Onboarding</p>
                  </div>
                </div>
                <ChevronRight size={18} className={activeTab === 'splash' ? 'text-green-700' : 'text-neutral-400'} />
              </div>

              {/* Customer App Card */}
              <div
                onClick={() => {
                  setActiveTab('customer');
                  setCustomerPath('/customer');
                }}
                className={cx(
                  'p-4 rounded-card border flex items-center justify-between cursor-pointer transition-all duration-fast',
                  activeTab === 'customer'
                    ? 'bg-green-50/80 border-green-300 text-neutral-900 shadow-1'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60'
                )}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={cx(
                      'flex h-11 w-11 items-center justify-center rounded-button transition-colors',
                      activeTab === 'customer' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    <Smartphone size={20} />
                  </span>
                  <div>
                    <h3 className="text-body font-semibold text-neutral-900">Customer App</h3>
                    <p className="text-small text-neutral-500">Request. Track. Deliver.</p>
                  </div>
                </div>
                <ChevronRight size={18} className={activeTab === 'customer' ? 'text-green-700' : 'text-neutral-400'} />
              </div>

              {/* Driver App Card */}
              <div
                onClick={() => {
                  setActiveTab('driver');
                  setDriverPath('/driver');
                }}
                className={cx(
                  'p-4 rounded-card border flex items-center justify-between cursor-pointer transition-all duration-fast',
                  activeTab === 'driver'
                    ? 'bg-green-50/80 border-green-300 text-neutral-900 shadow-1'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60'
                )}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={cx(
                      'flex h-11 w-11 items-center justify-center rounded-button transition-colors',
                      activeTab === 'driver' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    <Gauge size={20} />
                  </span>
                  <div>
                    <h3 className="text-body font-semibold text-neutral-900">Driver App</h3>
                    <p className="text-small text-neutral-500">Drive. Earn. Grow.</p>
                  </div>
                </div>
                <ChevronRight size={18} className={activeTab === 'driver' ? 'text-green-700' : 'text-neutral-400'} />
              </div>

              {/* Admin Portal Card */}
              <a
                href="/admin"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-card border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60 flex items-center justify-between cursor-pointer transition-all duration-fast"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-button bg-neutral-100 text-neutral-600">
                    <Monitor size={20} />
                  </span>
                  <div>
                    <h3 className="text-body font-semibold text-neutral-900">Admin Portal</h3>
                    <p className="text-small text-neutral-500">Manage. Support. Scale.</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-400" />
              </a>

              {/* Engagement Plan Card */}
              <a
                href="/proposal"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-card border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60 flex items-center justify-between cursor-pointer transition-all duration-fast"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-button bg-neutral-100 text-neutral-600">
                    <FileText size={20} />
                  </span>
                  <div>
                    <h3 className="text-body font-semibold text-neutral-900">Engagement Plan</h3>
                    <p className="text-small text-neutral-500">Scope. Timeline. Pricing.</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-neutral-400" />
              </a>
            </div>

            {/* Bottom "Using the demo" Callout Card */}
            <div className="bg-green-50/60 border border-green-200/80 rounded-card p-4.5 mt-8">
              <div className="flex items-center gap-2 text-green-700 font-semibold text-body-sm">
                <Lightbulb size={18} />
                <span className="text-neutral-900 font-semibold">Using the demo</span>
              </div>
              <p className="text-small text-neutral-600 leading-relaxed mt-2">
                Click and navigate through the screens to experience the core flows. The data is sample data for demonstration purposes.
              </p>
            </div>
          </aside>

          {/* RIGHT INTERACTIVE DUAL PHONE DEMO AREA (~70% width) */}
          <main className="flex-1 bg-neutral-100/70 p-6 lg:p-10 flex items-center justify-center overflow-x-auto min-h-[calc(100vh-70px)]">
            <div className="flex flex-col items-center gap-5 w-full">
              {/* MAP SIMULATION CONTROLS — shared above both phone panes */}
              <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-card shadow-1 px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                <div className="flex items-center gap-2 text-neutral-900 font-semibold text-body-sm shrink-0">
                  <Truck size={16} className="text-green-700" />
                  Map simulation
                </div>

                {/* Nearby truck count */}
                <div className="flex items-center gap-3">
                  <span className="text-small text-neutral-500">Nearby trucks</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNearbyTruckCount((n) => Math.max(0, n - 1))}
                      className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      disabled={nearbyTruckCount <= 0}
                      aria-label="Decrease nearby truck count"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-5 text-center font-semibold text-neutral-900 text-body-sm tabular-nums">
                      {nearbyTruckCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNearbyTruckCount((n) => Math.min(8, n + 1))}
                      className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      disabled={nearbyTruckCount >= 8}
                      aria-label="Increase nearby truck count"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Truck status mix */}
                <div className="flex items-center gap-3">
                  <span className="text-small text-neutral-500">Truck statuses</span>
                  <div className="flex items-center rounded-pill border border-neutral-200 p-0.5 bg-neutral-50">
                    <button
                      type="button"
                      onClick={() => setTruckStatusMix('available')}
                      className={cx(
                        'px-3 py-1 rounded-pill text-[11px] font-semibold transition-all',
                        truckStatusMix === 'available'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      )}
                    >
                      All available
                    </button>
                    <button
                      type="button"
                      onClick={() => setTruckStatusMix('mixed')}
                      className={cx(
                        'px-3 py-1 rounded-pill text-[11px] font-semibold transition-all',
                        truckStatusMix === 'mixed'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      )}
                    >
                      Mixed statuses
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-neutral-400 ml-auto">
                  Applies to the Customer App&apos;s pickup map
                </span>
              </div>

            <div className="flex flex-wrap items-start justify-center gap-8 lg:gap-12 py-4">
              {/* Customer App Pane */}
              <div className="flex flex-col items-center">
                <div className="text-center mb-3 max-w-[393px]">
                  <h2 className="text-h3 font-bold text-neutral-900">Customer Mobile App</h2>
                  <p className="text-small text-neutral-500 mt-0.5">
                    Book trucks, track in real-time and pay securely
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setCustomerPath('/splash')}
                      className={cx(
                        'px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all',
                        customerRoute === '/splash'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white text-neutral-600 hover:bg-neutral-200/80 border border-neutral-200'
                      )}
                    >
                      ✨ Splash Screen
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerPath('/auth/login')}
                      className={cx(
                        'px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all',
                        customerRoute === '/auth/login'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white text-neutral-600 hover:bg-neutral-200/80 border border-neutral-200'
                      )}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerPath('/customer')}
                      className={cx(
                        'px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all',
                        customerRoute === '/customer'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white text-neutral-600 hover:bg-neutral-200/80 border border-neutral-200'
                      )}
                    >
                      App Home
                    </button>
                  </div>
                </div>
                <AppStateProvider session={customerSession}>
                  {/* Login.jsx defaults its role tab from `location.state.role`, falling back to
                      'customer' when it's absent. A bare path string carries no state, so the
                      customer pane happened to work by luck (its fallback matches its own role) —
                      but the driver pane hit the same fallback and defaulted to Customer too,
                      submitting the demo customer credentials, then navigating to "/customer",
                      which doesn't exist in this pane's own routes (only auth + driver routes are
                      registered here) and silently rendered nothing. */}
                  <MemoryRouter key={customerKey} initialEntries={[{ pathname: customerRoute, state: { role: 'customer' } }]}>
                    <CustomerPaneRoutes />
                  </MemoryRouter>
                </AppStateProvider>
              </div>

              {/* Driver App Pane */}
              <div className="flex flex-col items-center">
                <div className="text-center mb-3 max-w-[393px]">
                  <h2 className="text-h3 font-bold text-neutral-900">Driver Mobile App</h2>
                  <p className="text-small text-neutral-500 mt-0.5">
                    Receive trips, manage earnings and grow your business
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setDriverPath('/splash')}
                      className={cx(
                        'px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all',
                        driverRoute === '/splash'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white text-neutral-600 hover:bg-neutral-200/80 border border-neutral-200'
                      )}
                    >
                      ✨ Splash Screen
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverPath('/auth/login')}
                      className={cx(
                        'px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all',
                        driverRoute === '/auth/login'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white text-neutral-600 hover:bg-neutral-200/80 border border-neutral-200'
                      )}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverPath('/driver')}
                      className={cx(
                        'px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all',
                        driverRoute === '/driver'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white text-neutral-600 hover:bg-neutral-200/80 border border-neutral-200'
                      )}
                    >
                      App Home
                    </button>
                  </div>
                </div>
                <AppStateProvider session={driverSession}>
                  <MemoryRouter key={driverKey} initialEntries={[{ pathname: driverRoute, state: { role: 'driver' } }]}>
                    <DriverPaneRoutes />
                  </MemoryRouter>
                </AppStateProvider>
              </div>
            </div>
            </div>
          </main>
        </div>
      </div>
    </LiveDemoSimContext.Provider>
    </LiveDemoDeviceContext.Provider>
  );
}
