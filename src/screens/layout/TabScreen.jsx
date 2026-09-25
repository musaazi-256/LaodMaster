import BottomNav from '../../components/navigation/BottomNav';

// Shared scaffold for the 4 top-level tab screens (Home/Trips/Wallet/Profile for
// Customer; Home/Trips/Wallet/More for Driver): scrollable content above a fixed
// BottomNav, both inside the PhoneFrame.
export default function TabScreen({ header, navItems, contentClassName = '', children }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {header}
      <div className={`flex-1 overflow-y-auto px-4 py-4 ${contentClassName}`}>{children}</div>
      <BottomNav items={navItems} />
    </div>
  );
}
