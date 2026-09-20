import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Receipt, Truck, Users, UserCheck, FileBarChart, Settings } from 'lucide-react';
import AdminSidebar from '../../components/navigation/AdminSidebar';

const GROUPS = [
  {
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/transactions', icon: Receipt, label: 'Transactions' },
      { to: '/admin/trips', icon: Truck, label: 'Trips' },
      { to: '/admin/drivers', icon: UserCheck, label: 'Drivers' },
      { to: '/admin/customers', icon: Users, label: 'Customers' },
      { to: '/admin/reports', icon: FileBarChart, label: 'Reports' },
    ],
  },
  {
    items: [{ to: '/admin/settings', icon: Settings, label: 'Settings' }],
  },
];

export default function AdminShell() {
  return (
    <div className="min-h-screen flex bg-neutral-50">
      <AdminSidebar groups={GROUPS} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
