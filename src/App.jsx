import { BrowserRouter, useRoutes } from 'react-router-dom';
import { ToastProvider } from './components/feedback/ToastProvider';
import { AppStateProvider } from './state/AppStateContext';

import StyleGuide from './screens/StyleGuide';
import LiveDemo from './screens/LiveDemo';
import Proposal from './screens/Proposal';
import { authRoutes, customerRoutes, driverRoutes, adminRoutes } from './routes/routeGroups';

// Any URL that doesn't match a real route hard-reloads to "/" instead of using
// react-router's <Navigate>. That matters specifically because "/" is one of the paths
// rendered with no ambient Router (see below) — a client-side <Navigate> would try to
// re-match "/" inside the *already-mounted* BrowserRouter and either loop or re-trigger
// the exact Router-inside-Router crash this file works around.
function HardRedirectHome() {
  window.location.href = '/';
  return null;
}

function AppRoutes() {
  return useRoutes([
    { path: '/style-guide', element: <StyleGuide /> },
    { path: '/proposal', element: <Proposal /> },
    ...authRoutes,
    ...customerRoutes,
    ...driverRoutes,
    ...adminRoutes,
    { path: '*', element: <HardRedirectHome /> },
  ]);
}

export default function App() {
  // LiveDemo is the app's landing experience at both "/" and "/live-demo", and it mounts
  // two independent <MemoryRouter> panes, each with its own AppStateProvider + in-memory
  // session (see LiveDemo.jsx) — real accounts now live in one shared backend, so two
  // panes just need two independent logins against it, not a shared React context.
  // React Router refuses to render a Router inside another Router, so LiveDemo has to
  // sit outside the main BrowserRouter entirely rather than being one of AppRoutes'
  // matches — both these paths are hard navigations in and out, never client-side.
  if (window.location.pathname === '/' || window.location.pathname === '/live-demo') {
    return (
      <ToastProvider>
        <LiveDemo />
      </ToastProvider>
    );
  }

  return (
    <BrowserRouter>
      <AppStateProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AppStateProvider>
    </BrowserRouter>
  );
}
