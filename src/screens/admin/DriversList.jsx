import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AdminPageHeader from '../layout/AdminPageHeader';
import FilterBar from '../../components/admin/FilterBar';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Avatar from '../../components/identity/Avatar';
import RatingStars from '../../components/identity/RatingStars';
import Button from '../../components/actions/Button';
import Modal from '../../components/feedback/Modal';
import TextField from '../../components/forms/TextField';
import PhoneField, { COUNTRIES } from '../../components/forms/PhoneField';
import Dropdown from '../../components/forms/Dropdown';
import { useToast } from '../../components/feedback/ToastProvider';
import { api } from '../../lib/api';
import { getTruckTier } from '../../mock-data/truckTiers';

const STATUS_TONE = { verified: 'success', pending: 'warning', unverified: 'neutral', rejected: 'danger' };

const TRUCK_TIER_OPTIONS = [
  { value: '', label: 'Select truck tier (optional)' },
  { value: 'pickup', label: 'Pickup Truck (1.5 ton)' },
  { value: 'light_truck', label: 'Light Truck (3-4 ton)' },
  { value: 'medium_truck', label: 'Medium Truck (7-10 ton)' },
  { value: 'heavy_truck', label: 'Heavy Duty (15-20 ton)' },
  { value: 'container', label: 'Container Carrier (40 ft)' },
  { value: 'flatbed', label: 'Flatbed Trailer' },
  { value: 'refrigerated', label: 'Refrigerated Truck' },
];

const VERIFICATION_OPTIONS = [
  { value: 'verified', label: 'Verified (Approved)' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'unverified', label: 'Unverified' },
];

export default function DriversList() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [drivers, setDrivers] = useState(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: 'pass123',
    vehicleModel: '',
    plateNumber: '',
    truckTierId: 'light_truck',
    verificationStatus: 'verified',
  });

  function fetchDrivers() {
    api.listDrivers().then((r) => setDrivers(r.drivers));
  }

  useEffect(() => {
    let alive = true;
    api.listDrivers().then((r) => alive && setDrivers(r.drivers));
    return () => { alive = false; };
  }, []);

  async function handleCreateDriver(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('Name and phone number are required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.adminCreateDriver({
        ...formData,
        phone: `${country.dialCode}${formData.phone}`,
      });
      addToast({ type: 'success', title: 'Driver Created', message: `${formData.name} has been added successfully.` });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: 'pass123',
        vehicleModel: '',
        plateNumber: '',
        truckTierId: 'light_truck',
        verificationStatus: 'verified',
      });
      fetchDrivers();
    } catch (err) {
      setFormError(err.message || 'Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  }

  const rows = (drivers ?? []).filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search) ||
    (d.vehicleModel && d.vehicleModel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <AdminPageHeader
        title="Drivers"
        description="Manage driver accounts, vehicle verification, and onboarding"
        actions={
          <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Driver
          </Button>
        }
      />

      <div className="p-8 flex flex-col gap-4">
        <FilterBar searchValue={search} onSearchChange={setSearch} placeholder="Search drivers by name, phone, or vehicle..." />
        <DataTable
          loading={!drivers}
          columns={[
            {
              key: 'name',
              header: 'Driver',
              render: (r) => (
                <span className="flex items-center gap-2.5">
                  <Avatar name={r.name} size="sm" />
                  <span className="text-neutral-900 font-medium">{r.name}</span>
                </span>
              ),
            },
            { key: 'phone', header: 'Phone' },
            {
              key: 'vehicle',
              header: 'Vehicle',
              render: (r) => (r.vehicleModel ? `${r.vehicleModel} · ${r.plateNumber || 'No plate'}` : '—'),
            },
            { key: 'tier', header: 'Truck category', render: (r) => getTruckTier(r.truckTierId)?.name ?? '—' },
            { key: 'rating', header: 'Rating', render: (r) => <RatingStars rating={r.rating} count={r.tripCount} /> },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusBadge tone={STATUS_TONE[r.verificationStatus]} label={r.verificationStatus} />,
            },
          ]}
          rows={rows}
          onRowClick={(r) => navigate(`/admin/drivers/${r.id}`)}
          emptyTitle="No drivers found"
          emptyDescription="Click '+ Add Driver' to register a new driver account directly from Admin."
        />
      </div>

      {/* CREATE DRIVER MODAL */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Driver"
        size="md"
      >
        <form onSubmit={handleCreateDriver} className="flex flex-col gap-4 pt-1">
          {formError && (
            <div className="p-3 text-small text-red-500 bg-red-50 rounded-button border border-red-200">
              {formError}
            </div>
          )}

          <TextField
            label="Full Name"
            placeholder="e.g. David Okello"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <PhoneField
            label="Phone Number"
            value={formData.phone}
            countryCode={country.code}
            onCountryChange={setCountry}
            onChange={(e) => {
              const val = typeof e === 'string' ? e : e?.target?.value ?? '';
              setFormData({ ...formData, phone: val.replace(/\D/g, '').slice(0, 9) });
            }}
            required
          />

          <TextField
            label="Email Address"
            type="email"
            placeholder="e.g. driver@example.com (optional)"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Vehicle Model"
              placeholder="e.g. Isuzu Elf 4-Ton"
              value={formData.vehicleModel}
              onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
            />

            <TextField
              label="License Plate"
              placeholder="e.g. UBK 456Z"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
            />
          </div>

          <Dropdown
            label="Truck Category Tier"
            options={TRUCK_TIER_OPTIONS}
            value={formData.truckTierId}
            onChange={(val) => setFormData({ ...formData, truckTierId: val })}
          />

          <Dropdown
            label="Initial Verification Status"
            options={VERIFICATION_OPTIONS}
            value={formData.verificationStatus}
            onChange={(val) => setFormData({ ...formData, verificationStatus: val })}
          />

          <TextField
            label="Default Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            helperText="The driver will use this password to log in to the Driver App."
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Driver
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
