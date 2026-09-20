import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet } from 'lucide-react';
import AdminPageHeader from '../layout/AdminPageHeader';
import FilterBar from '../../components/admin/FilterBar';
import DataTable from '../../components/admin/DataTable';
import Avatar from '../../components/identity/Avatar';
import Button from '../../components/actions/Button';
import Modal from '../../components/feedback/Modal';
import TextField from '../../components/forms/TextField';
import PhoneField, { COUNTRIES } from '../../components/forms/PhoneField';
import { useToast } from '../../components/feedback/ToastProvider';
import { formatUGX } from '../../lib/format';
import { api } from '../../lib/api';

export default function CustomersList() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState(null);
  const [search, setSearch] = useState('');

  // Modal State for Add Customer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: 'pass123',
    walletBalance: '0',
    referralCode: '',
  });

  function fetchCustomers() {
    api.adminListCustomers().then((r) => setCustomers(r.customers));
  }

  useEffect(() => {
    let alive = true;
    api.adminListCustomers().then((r) => alive && setCustomers(r.customers));
    return () => { alive = false; };
  }, []);

  async function handleCreateCustomer(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('Name and phone number are required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.adminCreateCustomer({
        ...formData,
        phone: `${country.dialCode}${formData.phone}`,
        walletBalance: Number(formData.walletBalance) || 0,
      });
      addToast({
        type: 'success',
        title: 'Customer Account Created',
        message: `${formData.name} has been added successfully.`,
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: 'pass123',
        walletBalance: '0',
        referralCode: '',
      });
      fetchCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to create customer account');
    } finally {
      setSubmitting(false);
    }
  }

  const rows = (customers ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Manage customer accounts, view wallet balances, and track order activity"
        actions={
          <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Customer
          </Button>
        }
      />

      <div className="p-8 flex flex-col gap-4">
        <FilterBar searchValue={search} onSearchChange={setSearch} placeholder="Search customers by name, phone, or email..." />

        <DataTable
          loading={!customers}
          columns={[
            {
              key: 'name',
              header: 'Customer',
              render: (r) => (
                <span className="flex items-center gap-2.5">
                  <Avatar name={r.name} size="sm" />
                  <span className="text-neutral-900 font-medium">{r.name}</span>
                </span>
              ),
            },
            { key: 'phone', header: 'Phone' },
            { key: 'email', header: 'Email', render: (r) => r.email || '—' },
            {
              key: 'walletBalance',
              header: 'Wallet Balance',
              render: (r) => (
                <span className="flex items-center gap-1 font-semibold text-green-700">
                  <Wallet size={14} className="text-green-500" />
                  {formatUGX(r.walletBalance ?? 0)}
                </span>
              ),
            },
            { key: 'tripCount', header: 'Total Trips', render: (r) => r.tripCount ?? 0 },
            {
              key: 'createdAt',
              header: 'Joined Date',
              render: (r) => (r.createdAt ? r.createdAt.slice(0, 10) : '—'),
            },
          ]}
          rows={rows}
          onRowClick={(r) => navigate(`/admin/customers/${r.id}`)}
          emptyTitle="No customers found"
          emptyDescription="Click '+ Add Customer' to register a new customer account directly from Admin."
        />
      </div>

      {/* CREATE CUSTOMER MODAL */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Customer"
        size="md"
      >
        <form onSubmit={handleCreateCustomer} className="flex flex-col gap-4 pt-1">
          {formError && (
            <div className="p-3 text-small text-red-500 bg-red-50 rounded-button border border-red-200">
              {formError}
            </div>
          )}

          <TextField
            label="Full Name"
            placeholder="e.g. Patricia Auma"
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
            placeholder="e.g. patricia@example.com (optional)"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <TextField
            label="Initial Wallet Balance (UGX)"
            type="number"
            placeholder="e.g. 50000"
            value={formData.walletBalance}
            onChange={(e) => setFormData({ ...formData, walletBalance: e.target.value })}
            helperText="Optionally credit the new customer's wallet upon registration."
          />

          <TextField
            label="Referral Code"
            placeholder="e.g. LOAD2026 (optional)"
            value={formData.referralCode}
            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
          />

          <TextField
            label="Default Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            helperText="The customer will use this password to log in to the Customer App."
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
