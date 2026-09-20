import { useAppState } from '../../state/AppStateContext';
import DashboardUnverified from './DashboardUnverified';
import DashboardVerified from './DashboardVerified';

export default function Dashboard() {
  const { driver } = useAppState();
  if (!driver.profile) return null;
  const isVerified = driver.profile.verificationStatus === 'verified';
  return isVerified ? <DashboardVerified /> : <DashboardUnverified />;
}
