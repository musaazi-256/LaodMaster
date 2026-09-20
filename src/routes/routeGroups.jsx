import PhoneFrame from '../screens/layout/PhoneFrame';
import RequireAuth from '../state/RequireAuth';

import SplashScreen from '../screens/auth/SplashScreen';
import SignUp from '../screens/auth/SignUp';
import Login from '../screens/auth/Login';
import ForgotPasswordRequest from '../screens/auth/ForgotPasswordRequest';
import ForgotPasswordOTP from '../screens/auth/ForgotPasswordOTP';
import ForgotPasswordReset from '../screens/auth/ForgotPasswordReset';
import AccountDeletion from '../screens/auth/AccountDeletion';

import Home from '../screens/customer/Home';
import RequestEntry from '../screens/customer/RequestEntry';
import LocationPickerScreen from '../screens/customer/LocationPickerScreen';
import CargoCategory from '../screens/customer/CargoCategory';
import Disclaimer from '../screens/customer/Disclaimer';
import TruckSelection from '../screens/customer/TruckSelection';
import FareConfirm from '../screens/customer/FareConfirm';
import PaymentMethodScreen from '../screens/customer/PaymentMethodScreen';
import TripRequested from '../screens/customer/TripRequested';
import TrackingScreen from '../screens/customer/TrackingScreen';
import TripHistoryList from '../screens/customer/TripHistoryList';
import TripDetail from '../screens/customer/TripDetail';
import WalletHome from '../screens/customer/WalletHome';
import DepositScreen from '../screens/customer/DepositScreen';
import CustomerWithdrawalRequest from '../screens/customer/WithdrawalRequest';
import AddPaymentMethod from '../screens/customer/AddPaymentMethod';
import TransactionHistory from '../screens/customer/TransactionHistory';
import TransactionDetail from '../screens/customer/TransactionDetail';
import PaymentFailureRetry from '../screens/customer/PaymentFailureRetry';
import ProfileView from '../screens/customer/ProfileView';
import ProfileEdit from '../screens/customer/ProfileEdit';
import Settings from '../screens/customer/Settings';
import HelpSupport from '../screens/customer/HelpSupport';

import VehicleDetailsForm from '../screens/driver/VehicleDetailsForm';
import DocumentUpload from '../screens/driver/DocumentUpload';
import SubmittedPending from '../screens/driver/SubmittedPending';
import Dashboard from '../screens/driver/Dashboard';
import IncomingRequest from '../screens/driver/IncomingRequest';
import DriverTripScreen from '../screens/driver/DriverTripScreen';
import TripCompleteRating from '../screens/driver/TripCompleteRating';
import DriverTripHistoryList from '../screens/driver/DriverTripHistoryList';
import DriverTripDetail from '../screens/driver/DriverTripDetail';
import EarningsSummary from '../screens/driver/EarningsSummary';
import CashDueTracker from '../screens/driver/CashDueTracker';
import DriverTransactionHistory from '../screens/driver/DriverTransactionHistory';
import WithdrawalRequest from '../screens/driver/WithdrawalRequest';
import DriverPaymentMethod from '../screens/driver/DriverPaymentMethod';
import DriverMenu from '../screens/driver/DriverMenu';
import DriverProfile from '../screens/driver/DriverProfile';
import VehicleDetailsView from '../screens/driver/VehicleDetailsView';
import DriverSupport from '../screens/driver/DriverSupport';

import AdminShell from '../screens/layout/AdminShell';
import AdminDashboard from '../screens/admin/AdminDashboard';
import TransactionsList from '../screens/admin/TransactionsList';
import DriversList from '../screens/admin/DriversList';
import DriverDetail from '../screens/admin/DriverDetail';
import CustomersList from '../screens/admin/CustomersList';
import CustomerDetail from '../screens/admin/CustomerDetail';
import TripsList from '../screens/admin/TripsList';
import AdminTripDetail from '../screens/admin/AdminTripDetail';
import Reports from '../screens/admin/Reports';
import AccessSettings from '../screens/admin/AccessSettings';

// Route groups as plain config objects (the `useRoutes()` shape) rather than JSX
// <Route> trees. <Routes> statically inspects its JSX children and requires each one
// to literally be a <Route> element, so a wrapper component returning <Route>s can't
// be dropped in as a child — the object form has no such restriction and composes
// freely. LiveDemo.jsx reuses these same arrays to mount independent copies of the
// Customer/Driver route trees, each in its own isolated <MemoryRouter> pane, while both
// still share the single AppStateProvider above them — that's what makes the two panes
// interact live: same React state, two separate in-memory navigation histories.

export const authRoutes = [
  {
    element: <PhoneFrame />,
    children: [
      { path: '/splash', element: <SplashScreen /> },
      { path: '/auth/splash', element: <SplashScreen /> },
      { path: '/auth/signup', element: <SignUp /> },
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordRequest /> },
      { path: '/auth/forgot-password/otp', element: <ForgotPasswordOTP /> },
      { path: '/auth/forgot-password/reset', element: <ForgotPasswordReset /> },
      { path: '/auth/delete-account', element: <AccountDeletion /> },
    ],
  },
];

export const customerRoutes = [
  {
    element: (
      <RequireAuth role="customer">
        <PhoneFrame />
      </RequireAuth>
    ),
    children: [
      { path: '/customer', element: <Home /> },
      { path: '/customer/request', element: <RequestEntry /> },
      { path: '/customer/request/location', element: <LocationPickerScreen /> },
      { path: '/customer/request/cargo', element: <CargoCategory /> },
      { path: '/customer/request/disclaimer', element: <Disclaimer /> },
      { path: '/customer/request/trucks', element: <TruckSelection /> },
      { path: '/customer/request/fare', element: <FareConfirm /> },
      { path: '/customer/request/payment', element: <PaymentMethodScreen /> },
      { path: '/customer/request/searching', element: <TripRequested /> },
      { path: '/customer/tracking/:id', element: <TrackingScreen /> },
      { path: '/customer/trips', element: <TripHistoryList /> },
      { path: '/customer/trips/:id', element: <TripDetail /> },
      { path: '/customer/wallet', element: <WalletHome /> },
      { path: '/customer/wallet/deposit', element: <DepositScreen /> },
      { path: '/customer/wallet/withdraw', element: <CustomerWithdrawalRequest /> },
      { path: '/customer/wallet/add-method', element: <AddPaymentMethod /> },
      { path: '/customer/wallet/transactions', element: <TransactionHistory /> },
      { path: '/customer/wallet/transactions/:id', element: <TransactionDetail /> },
      { path: '/customer/wallet/payment-failed', element: <PaymentFailureRetry /> },
      { path: '/customer/profile', element: <ProfileView /> },
      { path: '/customer/profile/edit', element: <ProfileEdit /> },
      { path: '/customer/settings', element: <Settings /> },
      { path: '/customer/help', element: <HelpSupport /> },
    ],
  },
];

export const driverRoutes = [
  {
    element: (
      <RequireAuth role="driver">
        <PhoneFrame />
      </RequireAuth>
    ),
    children: [
      { path: '/driver', element: <Dashboard /> },
      { path: '/driver/register/vehicle', element: <VehicleDetailsForm /> },
      { path: '/driver/register/documents', element: <DocumentUpload /> },
      { path: '/driver/register/submitted', element: <SubmittedPending /> },
      { path: '/driver/requests/incoming', element: <IncomingRequest /> },
      { path: '/driver/trip', element: <DriverTripScreen /> },
      { path: '/driver/trip/complete', element: <TripCompleteRating /> },
      { path: '/driver/trips', element: <DriverTripHistoryList /> },
      { path: '/driver/trips/:id', element: <DriverTripDetail /> },
      { path: '/driver/earnings', element: <EarningsSummary /> },
      { path: '/driver/earnings/cash-due', element: <CashDueTracker /> },
      { path: '/driver/earnings/transactions', element: <DriverTransactionHistory /> },
      { path: '/driver/earnings/withdraw', element: <WithdrawalRequest /> },
      { path: '/driver/payment-method', element: <DriverPaymentMethod /> },
      { path: '/driver/menu', element: <DriverMenu /> },
      { path: '/driver/profile', element: <DriverProfile /> },
      { path: '/driver/vehicle', element: <VehicleDetailsView /> },
      { path: '/driver/support', element: <DriverSupport /> },
    ],
  },
];

export const adminRoutes = [
  {
    element: <AdminShell />,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/admin/transactions', element: <TransactionsList /> },
      { path: '/admin/drivers', element: <DriversList /> },
      { path: '/admin/drivers/:id', element: <DriverDetail /> },
      { path: '/admin/customers', element: <CustomersList /> },
      { path: '/admin/customers/:id', element: <CustomerDetail /> },
      { path: '/admin/trips', element: <TripsList /> },
      { path: '/admin/trips/:id', element: <AdminTripDetail /> },
      { path: '/admin/reports', element: <Reports /> },
      { path: '/admin/settings', element: <AccessSettings /> },
    ],
  },
];
