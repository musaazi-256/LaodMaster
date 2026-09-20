import { Navigate, useLocation } from 'react-router-dom';
import { useAppState } from './AppStateContext';

// Gates the /customer/* and /driver/* route trees on a real signed-in session for that
// role — no more fixed "the customer is always John Ssebunya" persona. Unauthenticated
// (or wrong-role) access bounces to login with the originally-requested path preserved,
// so the login screen can send them back afterward.
export default function RequireAuth({ role, children }) {
  const { auth } = useAppState();
  const location = useLocation();

  if (!auth.user || auth.user.role !== role) {
    return <Navigate to="/splash" state={{ from: location.pathname, role }} replace />;
  }
  return children;
}
