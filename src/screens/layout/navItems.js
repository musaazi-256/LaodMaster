import { Home, Calendar, Wallet, MessageSquare, User } from 'lucide-react';

export const CUSTOMER_NAV_ITEMS = [
  { to: '/customer', icon: Home, label: 'Home' },
  { to: '/customer/trips', icon: Calendar, label: 'Trips' },
  { to: '/customer/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/customer/help', icon: MessageSquare, label: 'Messages', badge: 2 },
  { to: '/customer/profile', icon: User, label: 'Profile' },
];

export const DRIVER_NAV_ITEMS = [
  { to: '/driver', icon: Home, label: 'Home' },
  { to: '/driver/trips', icon: Calendar, label: 'Trips' },
  { to: '/driver/earnings', icon: Wallet, label: 'Wallet' },
  { to: '/driver/support', icon: MessageSquare, label: 'Messages', badge: 2 },
  { to: '/driver/menu', icon: User, label: 'Profile' },
];
