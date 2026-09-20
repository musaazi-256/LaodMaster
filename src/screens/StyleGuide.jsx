import { useState } from 'react';
import { Truck, Plus, Home, Receipt, Wallet, User, Search, MapPin } from 'lucide-react';

import ColorTokens from '../components/foundations/ColorTokens';
import TypeScale from '../components/foundations/TypeScale';
import SpacingScale from '../components/foundations/SpacingScale';
import RadiusScale from '../components/foundations/RadiusScale';

import Button from '../components/actions/Button';
import IconButton from '../components/actions/IconButton';
import FAB from '../components/actions/FAB';

import TextField from '../components/forms/TextField';
import PhoneField from '../components/forms/PhoneField';
import SearchField from '../components/forms/SearchField';
import LocationField from '../components/forms/LocationField';
import Dropdown from '../components/forms/Dropdown';
import DatePicker from '../components/forms/DatePicker';
import Radio from '../components/forms/Radio';
import Checkbox from '../components/forms/Checkbox';
import Toggle from '../components/forms/Toggle';
import { Card as ShadcnCard, CardHeader, CardTitle, CardDescription, CardContent, Badge as ShadcnBadge, Switch as ShadcnSwitch } from '../components/ui';

import Tabs from '../components/navigation/Tabs';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import TopAppBar from '../components/navigation/TopAppBar';
import BottomNav from '../components/navigation/BottomNav';

import Toast from '../components/feedback/Toast';
import BottomSheet from '../components/feedback/BottomSheet';
import Modal from '../components/feedback/Modal';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import ErrorState from '../components/feedback/ErrorState';

import TruckCard from '../components/logistics/TruckCard';
import TruckSelector from '../components/logistics/TruckSelector';
import DriverCard from '../components/logistics/DriverCard';
import TripCard from '../components/logistics/TripCard';
import FareBreakdown from '../components/logistics/FareBreakdown';
import ETACard from '../components/logistics/ETACard';
import TripTimeline from '../components/logistics/TripTimeline';
import LocationPicker from '../components/logistics/LocationPicker';
import RouteLine from '../components/logistics/RouteLine';
import TrackingCard from '../components/logistics/TrackingCard';
import MapCanvas from '../components/logistics/MapCanvas';

import WalletCard from '../components/payments/WalletCard';
import PaymentMethodSelector from '../components/payments/PaymentMethodSelector';
import TransactionRow from '../components/payments/TransactionRow';
import BalanceDisplay from '../components/payments/BalanceDisplay';
import PaymentStatusBadge from '../components/payments/PaymentStatusBadge';
import RefundCard from '../components/payments/RefundCard';

import Avatar from '../components/identity/Avatar';
import Logo from '../components/identity/Logo';
import SplashScreen from './auth/SplashScreen';
import DriverVerificationBadge from '../components/identity/DriverVerificationBadge';
import VehicleVerificationBadge from '../components/identity/VehicleVerificationBadge';
import RatingStars from '../components/identity/RatingStars';
import DocumentUploadCard from '../components/identity/DocumentUploadCard';

import MetricCard from '../components/admin/MetricCard';
import DataTable from '../components/admin/DataTable';
import FilterBar from '../components/admin/FilterBar';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import ChartCard from '../components/admin/ChartCard';

import { TRUCK_TIERS } from '../mock-data/truckTiers';
import { DRIVERS, CURRENT_DRIVER } from '../mock-data/drivers';
import { TRIPS } from '../mock-data/trips';
import { PAYMENT_METHODS, TRANSACTIONS } from '../mock-data/transactions';
import { RECENT_DESTINATIONS, LOCATION_SUGGESTIONS } from '../mock-data/users';

const MAP_STATES = [
  'searching',
  'driver_assigned',
  'driver_approaching',
  'driver_arrived',
  'trip_started',
  'en_route',
  'near_destination',
  'arrived',
  'completed',
];

function Section({ id, title, description, children }) {
  return (
    <section id={id} className="flex flex-col gap-4 py-10 border-b border-neutral-200">
      <div>
        <h2 className="text-h2 text-neutral-900">{title}</h2>
        {description && <p className="text-body-sm text-neutral-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ children, className = '' }) {
  return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{children}</div>;
}

function Label({ children }) {
  return <span className="text-small font-medium uppercase tracking-wide text-neutral-500">{children}</span>;
}

export default function StyleGuide() {
  const [checked, setChecked] = useState(true);
  const [toggled, setToggled] = useState(true);
  const [radioValue, setRadioValue] = useState('customer');
  const [tabValue, setTabValue] = useState('search');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('small-medium');
  const [searchText, setSearchText] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('pm-1');
  const [cargoCategory, setCargoCategory] = useState('');

  const navSections = [
    'Foundations', 'shadcn/ui Kit', 'Actions', 'Forms', 'Navigation', 'Feedback', 'Logistics', 'Payments', 'Identity', 'Admin',
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="h-7" />
            <span className="text-h4 text-neutral-900 border-l border-neutral-300 pl-3">Style Guide</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 overflow-x-auto">
            {navSections.map((s) => (
              <a key={s} href={`#${s.toLowerCase()}`} className="text-body-sm text-neutral-500 hover:text-green-700 whitespace-nowrap">
                {s}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <Section id="foundations" title="Foundations" description="Color, type, spacing and radius tokens — implemented exactly as tailwind.config.js theme.extend.">
          <Label>Colors</Label>
          <ColorTokens />
          <Label>Typography</Label>
          <TypeScale />
          <Label>Spacing (4px base scale)</Label>
          <SpacingScale />
          <Label>Radius</Label>
          <RadiusScale />
        </Section>

        <Section id="shadcn" title="shadcn/ui Kit">
          <Label>Card & Badges — Primitive Elements</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ShadcnCard>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>shadcn/ui Architecture</CardTitle>
                  <ShadcnBadge variant="success">Active</ShadcnBadge>
                </div>
                <CardDescription>Radix UI Primitives + Tailwind CSS + CVA</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-body-sm text-neutral-600">
                  Every button, card, input, dialog, and switch in LoadMaster V2 is powered by standard shadcn/ui primitives.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <ShadcnBadge variant="default">Primary Green</ShadcnBadge>
                  <ShadcnBadge variant="secondary">Neutral Slate</ShadcnBadge>
                  <ShadcnBadge variant="outline">Border Outline</ShadcnBadge>
                  <ShadcnBadge variant="warning">Pending</ShadcnBadge>
                </div>
              </CardContent>
            </ShadcnCard>

            <ShadcnCard>
              <CardHeader>
                <CardTitle>Primitive Controls</CardTitle>
                <CardDescription>Switches, Sliders & Accessible Primitives</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-semibold text-neutral-800">Radix Switch Control</span>
                  <ShadcnSwitch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-semibold text-neutral-800">System Notifications</span>
                  <ShadcnSwitch />
                </div>
              </CardContent>
            </ShadcnCard>
          </div>
        </Section>

        <Section id="actions" title="Actions">
          <Label>Button — variants</Label>
          <Row>
            <Button variant="primary">Search Truck</Button>
            <Button variant="secondary">Match Driver</Button>
            <Button variant="tertiary">Change location</Button>
            <Button variant="danger">Cancel Trip</Button>
          </Row>
          <Label>Button — sizes</Label>
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Label>Button — states</Label>
          <Row>
            <Button>Default</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button icon={Plus}>With icon</Button>
            <Button fullWidth className="max-w-xs">Full width</Button>
          </Row>
          <Label>IconButton</Label>
          <Row>
            <IconButton icon={Search} label="Search" variant="primary" />
            <IconButton icon={Search} label="Search" variant="secondary" />
            <IconButton icon={Search} label="Search" variant="ghost" />
            <IconButton icon={Search} label="Search" size="sm" />
            <IconButton icon={Search} label="Search" size="lg" />
          </Row>
          <Label>FAB</Label>
          <Row>
            <FAB icon={Plus} label="Add" />
          </Row>
        </Section>

        <Section id="forms" title="Forms">
          <Label>TextField — states</Label>
          <Row className="items-start">
            <TextField label="Default" placeholder="Enter text" className="w-64" />
            <TextField label="Filled" defaultValue="John Ssebunya" className="w-64" />
            <TextField label="Error" defaultValue="john@" error="Enter a valid email" className="w-64" />
            <TextField label="Success" defaultValue="john@example.com" success className="w-64" />
            <TextField label="Disabled" placeholder="Disabled" disabled className="w-64" />
            <TextField label="Read-only" defaultValue="Read only value" readOnly className="w-64" />
            <TextField label="With icon" placeholder="Search destination" icon={MapPin} className="w-64" />
          </Row>
          <Label>PhoneField</Label>
          <Row>
            <PhoneField className="w-64" />
          </Row>
          <Label>SearchField</Label>
          <Row>
            <SearchField value={searchText} onChange={(e) => setSearchText(e.target.value)} onClear={() => setSearchText('')} className="w-64" />
          </Row>
          <Label>LocationField</Label>
          <Row className="items-start">
            <LocationField type="pickup" label="Pickup" value="Ntinda Trading Centre" className="w-72" />
            <LocationField type="destination" label="Drop-off" placeholder="Where to?" className="w-72" />
          </Row>
          <Label>Dropdown</Label>
          <Row>
            <Dropdown
              label="Cargo category"
              placeholder="Select category"
              value={cargoCategory}
              onChange={(e) => setCargoCategory(e.target.value)}
              options={[{ value: 'general', label: 'General goods' }, { value: 'shifting', label: 'Shifting' }, { value: 'construction', label: 'Construction materials' }]}
              className="w-64"
            />
          </Row>
          <Label>DatePicker</Label>
          <Row>
            <DatePicker label="Trip date" className="w-64" />
          </Row>
          <Label>Radio / Checkbox / Toggle</Label>
          <Row>
            <Radio name="role" label="Customer" checked={radioValue === 'customer'} onChange={() => setRadioValue('customer')} />
            <Radio name="role" label="Driver" checked={radioValue === 'driver'} onChange={() => setRadioValue('driver')} />
            <Checkbox label="I agree to terms" checked={checked} onChange={() => setChecked((c) => !c)} />
            <Toggle label="Available for trips" checked={toggled} onChange={setToggled} />
          </Row>
        </Section>

        <Section id="navigation" title="Navigation">
          <Label>Tabs — underline</Label>
          <Tabs
            variant="underline"
            value={tabValue}
            onChange={setTabValue}
            items={[{ value: 'search', label: 'Search Truck' }, { value: 'match', label: 'Match Driver' }]}
          />
          <Label>Tabs — pill</Label>
          <Tabs
            variant="pill"
            value={tabValue}
            onChange={setTabValue}
            items={[{ value: 'search', label: 'Search Truck' }, { value: 'match', label: 'Match Driver' }]}
            className="max-w-xs"
          />
          <Label>Breadcrumbs</Label>
          <Breadcrumbs items={[{ label: 'Admin', to: '#' }, { label: 'Trips', to: '#' }, { label: 'Trip #1002' }]} />
          <Label>TopAppBar</Label>
          <div className="rounded-card overflow-hidden border border-neutral-200">
            <TopAppBar title="Trip details" onBack={() => {}} />
          </div>
          <Label>BottomNav (customer)</Label>
          <div className="rounded-card overflow-hidden border border-neutral-200 max-w-sm">
            <BottomNav
              items={[
                { to: '/style-guide', icon: Home, label: 'Home' },
                { to: '#trips', icon: Receipt, label: 'Trips' },
                { to: '#wallet', icon: Wallet, label: 'Wallet' },
                { to: '#profile', icon: User, label: 'Profile' },
              ]}
            />
          </div>
        </Section>

        <Section id="feedback" title="Feedback">
          <Label>Toast — variants</Label>
          <div className="flex flex-col gap-2 max-w-sm">
            <Toast variant="success" message="Payment successful" />
            <Toast variant="error" message="Payment failed" />
            <Toast variant="warning" message="Verification pending" />
            <Toast variant="info" message="Driver is on the way" />
          </div>
          <Label>BottomSheet / Modal</Label>
          <Row>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>Open BottomSheet</Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
          </Row>
          <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Select payment method">
            <PaymentMethodSelector methods={PAYMENT_METHODS} selectedId={selectedPayment} onSelect={setSelectedPayment} />
          </BottomSheet>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Cancel this trip?"
            footer={
              <>
                <Button variant="tertiary" onClick={() => setModalOpen(false)}>Keep trip</Button>
                <Button variant="danger" onClick={() => setModalOpen(false)}>Cancel trip</Button>
              </>
            }
          >
            <p className="text-body-sm text-neutral-600">A cancellation fee may apply depending on how far the driver has travelled.</p>
          </Modal>
          <Label>SkeletonLoader</Label>
          <Row className="items-center">
            <SkeletonLoader variant="circle" width={44} height={44} />
            <div className="flex flex-col gap-2 w-48">
              <SkeletonLoader variant="text" width="80%" />
              <SkeletonLoader variant="text" width="50%" />
            </div>
          </Row>
          <Label>EmptyState / ErrorState</Label>
          <Row className="items-start">
            <div className="border border-neutral-200 rounded-card flex-1 min-w-[240px]">
              <EmptyState title="No trips yet" description="Your trip history will show up here." />
            </div>
            <div className="border border-neutral-200 rounded-card flex-1 min-w-[240px]">
              <ErrorState description="We couldn't load this page. Please try again." action={<Button size="sm">Retry</Button>} />
            </div>
          </Row>
        </Section>

        <Section id="logistics" title="Logistics">
          <Label>TruckCard</Label>
          <Row className="items-start">
            {TRUCK_TIERS.slice(0, 3).map((tier) => (
              <div key={tier.id} className="w-72">
                <TruckCard tier={tier} selected={tier.id === selectedTier} onSelect={() => setSelectedTier(tier.id)} estimatedFare={95000} />
              </div>
            ))}
          </Row>
          <Label>TruckSelector (collapsible, 5 tiers)</Label>
          <div className="max-w-md">
            <TruckSelector selectedTierId={selectedTier} onSelect={setSelectedTier} recommendedTierId="small-medium" fareByTier={{ small: 40000, 'small-medium': 70000, medium: 120000, large: 240000, 'extra-large': 420000 }} />
          </div>
          <Label>DriverCard</Label>
          <div className="max-w-md">
            <DriverCard driver={DRIVERS[0]} />
          </div>
          <Label>TripCard — status variants (mobile)</Label>
          <div className="flex flex-col gap-3 max-w-md">
            {TRIPS.map((trip) => (
              <TripCard key={trip.id} trip={trip} status={trip.status} surface="mobile" />
            ))}
          </div>
          <Label>TripCard — desktop / admin density</Label>
          <div className="flex flex-col gap-3">
            {TRIPS.slice(0, 2).map((trip) => (
              <TripCard key={trip.id} trip={trip} status={trip.status} surface="desktop" role="admin" />
            ))}
          </div>
          <Label>FareBreakdown</Label>
          <div className="max-w-sm">
            <FareBreakdown
              items={[{ label: 'Base fare', amount: 40000 }, { label: 'Distance (12km)', amount: 60000 }, { label: 'Loading assistance', amount: 20000 }]}
              total={120000}
              disclaimer="Loading and offloading costs are estimates and may vary on-site."
            />
          </div>
          <Label>ETACard</Label>
          <div className="max-w-sm">
            <ETACard etaMinutes={5} distanceKm={2.1} />
          </div>
          <Label>TripTimeline</Label>
          <div className="max-w-sm">
            <TripTimeline
              steps={[
                { label: 'Trip requested', time: '9:02 AM', completed: true },
                { label: 'Driver accepted', time: '9:04 AM', completed: true },
                { label: 'Driver en route', time: '9:06 AM', active: true },
                { label: 'Trip completed' },
              ]}
            />
          </div>
          <Label>LocationPicker</Label>
          <div className="max-w-sm border border-neutral-200 rounded-card p-3">
            <LocationPicker
              searchValue={locationSearch}
              onSearchChange={setLocationSearch}
              suggestions={LOCATION_SUGGESTIONS}
              recentLocations={RECENT_DESTINATIONS}
            />
          </div>
          <Label>RouteLine</Label>
          <div className="max-w-sm">
            <RouteLine originLabel="Ntinda Trading Centre" destinationLabel="Entebbe International Airport" />
          </div>
          <Label>TrackingCard</Label>
          <div className="max-w-sm">
            <TrackingCard driver={CURRENT_DRIVER} statusText="John's truck is on the way" etaMinutes={5} distanceKm={2.1} />
          </div>
          <Label>MapCanvas — all 9 tracking states</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAP_STATES.map((state) => (
              <div key={state} className="flex flex-col gap-1.5">
                <MapCanvas state={state} originLabel="Ntinda" destinationLabel="Entebbe" />
                <span className="text-small text-neutral-500 font-mono">{state}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="payments" title="Payments">
          <Label>WalletCard</Label>
          <div className="max-w-sm">
            <WalletCard balance={245000} onTopUp={() => {}} />
          </div>
          <Label>BalanceDisplay</Label>
          <BalanceDisplay amount={245000} />
          <Label>PaymentMethodSelector</Label>
          <div className="max-w-sm">
            <PaymentMethodSelector methods={PAYMENT_METHODS} selectedId={selectedPayment} onSelect={setSelectedPayment} />
          </div>
          <Label>PaymentStatusBadge — statuses</Label>
          <Row>
            <PaymentStatusBadge status="pending" />
            <PaymentStatusBadge status="success" />
            <PaymentStatusBadge status="failed" />
            <PaymentStatusBadge status="refunded" />
          </Row>
          <Label>TransactionRow</Label>
          <div className="max-w-md divide-y divide-neutral-200">
            {TRANSACTIONS.map((t) => (
              <TransactionRow key={t.id} {...t} />
            ))}
          </div>
          <Label>RefundCard</Label>
          <div className="max-w-sm">
            <RefundCard amount={42000} status="pending" reason="Trip cancelled by driver before pickup." onAction={() => {}} />
          </div>
        </Section>

        <Section id="identity" title="Identity">
          <Label>SplashScreen — mobile onboarding & launch screen</Label>
          <div className="h-[540px] w-full max-w-[340px] rounded-[32px] overflow-hidden border border-neutral-800 shadow-2xl relative my-2">
            <SplashScreen />
          </div>
          <Label>Logo — official brand asset</Label>
          <Row className="items-center">
            <Logo size="sm" />
            <Logo size="md" />
            <Logo size="lg" showTagline />
          </Row>
          <Label>Avatar — sizes</Label>
          <Row>
            <Avatar name="John Ssebunya" size="sm" />
            <Avatar name="John Ssebunya" size="md" />
            <Avatar name="John Ssebunya" size="lg" />
          </Row>
          <Label>DriverVerificationBadge / VehicleVerificationBadge</Label>
          <Row>
            <DriverVerificationBadge status="verified" />
            <DriverVerificationBadge status="pending" />
            <DriverVerificationBadge status="unverified" />
            <VehicleVerificationBadge status="verified" />
            <VehicleVerificationBadge status="pending" />
            <VehicleVerificationBadge status="unverified" />
          </Row>
          <Label>RatingStars</Label>
          <Row>
            <RatingStars rating={4.8} count={246} />
          </Row>
          <Label>DocumentUploadCard — statuses</Label>
          <Row className="items-start">
            <div className="w-64"><DocumentUploadCard label="Driving permit" status="empty" /></div>
            <div className="w-64"><DocumentUploadCard label="Driving permit" status="pending" fileName="permit.pdf" /></div>
            <div className="w-64"><DocumentUploadCard label="Driving permit" status="verified" fileName="permit.pdf" /></div>
            <div className="w-64"><DocumentUploadCard label="Driving permit" status="rejected" fileName="permit.pdf" /></div>
          </Row>
        </Section>

        <Section id="admin" title="Admin">
          <Label>MetricCard</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Total Trips" value="1,204" icon={Truck} delta="+8.2%" deltaDirection="up" />
            <MetricCard label="Revenue" value="UGX 42.1M" icon={Wallet} delta="+3.4%" deltaDirection="up" />
            <MetricCard label="Active Drivers" value="86" icon={User} delta="-1.1%" deltaDirection="down" />
            <MetricCard label="Customers" value="3,920" icon={User} delta="+12%" deltaDirection="up" />
          </div>
          <Label>ChartCard — bar / line</Label>
          <Row className="items-start">
            <div className="flex-1 min-w-[260px]">
              <ChartCard
                title="Trips overview"
                subtitle="Last 6 days"
                type="bar"
                data={[
                  { label: 'Mon', value: 32 }, { label: 'Tue', value: 48 }, { label: 'Wed', value: 40 },
                  { label: 'Thu', value: 60 }, { label: 'Fri', value: 52 }, { label: 'Sat', value: 70 },
                ]}
              />
            </div>
            <div className="flex-1 min-w-[260px]">
              <ChartCard
                title="Revenue"
                subtitle="Last 6 days (UGX '000)"
                type="line"
                data={[
                  { label: 'Mon', value: 1200 }, { label: 'Tue', value: 1800 }, { label: 'Wed', value: 1500 },
                  { label: 'Thu', value: 2200 }, { label: 'Fri', value: 1900 }, { label: 'Sat', value: 2600 },
                ]}
              />
            </div>
          </Row>
          <Label>FilterBar</Label>
          <FilterBar
            searchValue={searchText}
            onSearchChange={setSearchText}
            filters={[{ id: 'status', label: 'Status', value: '', options: [{ value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }] }]}
            onOpenFilters={() => {}}
          />
          <Label>StatusBadge — tones</Label>
          <Row>
            <StatusBadge tone="success" label="Verified" />
            <StatusBadge tone="warning" label="Pending" />
            <StatusBadge tone="danger" label="Failed" />
            <StatusBadge tone="info" label="En route" />
            <StatusBadge tone="neutral" label="Draft" />
          </Row>
          <Label>DataTable — populated / loading / empty</Label>
          <div className="flex flex-col gap-4">
            <DataTable
              columns={[
                { key: 'id', header: 'Trip ID' },
                { key: 'route', header: 'Route', render: (r) => `${r.origin} → ${r.destination}` },
                { key: 'fare', header: 'Fare', render: (r) => `UGX ${r.fare.toLocaleString()}` },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge tone={r.status === 'completed' ? 'success' : r.status === 'cancelled' ? 'danger' : 'info'} label={r.status} /> },
              ]}
              rows={TRIPS}
            />
            <DataTable columns={[{ key: 'id', header: 'Trip ID' }, { key: 'route', header: 'Route' }]} rows={[]} loading />
            <DataTable columns={[{ key: 'id', header: 'Trip ID' }, { key: 'route', header: 'Route' }]} rows={[]} emptyTitle="No trips found" emptyDescription="Try adjusting your filters." />
          </div>
          <Label>Pagination</Label>
          <Pagination page={2} totalPages={8} onPageChange={() => {}} />
        </Section>

        <div className="py-10 text-center text-small text-neutral-500">
          LoadMastr V2 — Phase 1 component library. Every component here is imported directly by screens; nothing here is styled ad-hoc.
        </div>
      </div>
    </div>
  );
}
