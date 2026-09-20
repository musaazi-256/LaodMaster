import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Receipt, Truck, PlusCircle } from 'lucide-react';
import AdminPageHeader from '../layout/AdminPageHeader';
import Avatar from '../../components/identity/Avatar';
import Button from '../../components/actions/Button';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/feedback/Modal';
import TextField from '../../components/forms/TextField';
import { useToast } from '../../components/feedback/ToastProvider';
import { formatUGX } from '../../lib/format';
import { api } from '../../lib/api';

const STATUS_TONE = { completed: 'success', requested: 'warning', searching: 'warning', cancelled: 'danger' };

export default function CustomerDetail() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Top-Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCustomer = useCallback(() => {
    setLoading(true);
    api
      .adminGetCustomer(id)
      .then((res) => setData(res))
      .catch((err) => addToast({ type: 'danger', title: 'Error', message: err.message }))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  async function handleTopUp(e) {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    try {
      await api.adminUpdateCustomer(id, { topUpAmount: amount });
      addToast({
        type: 'success',
        title: 'Wallet Credited',
        message: `Successfully added ${formatUGX(amount)} to ${data?.customer?.name}'s wallet.`,
      });
      setIsTopUpOpen(false);
      setTopUpAmount('');
      loadCustomer();
    } catch (err) {
      addToast({ type: 'danger', title: 'Top-Up Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !data) {
    return (
      <div>
        <AdminPageHeader title="Customer Profile" description="Loading customer account details..." />
        <div className="p-8 text-neutral-500">Loading customer profile...</div>
      </div>
    );
  }

  const { customer, trips = [], transactions = [] } = data;

  return (
    <div>
      <AdminPageHeader
        title={
          <div className="flex items-center gap-3">
            <Link to="/admin/customers" className="text-neutral-500 hover:text-neutral-900 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <Avatar name={customer.name} size="md" />
            <div>
              <span className="text-h2 text-neutral-900">{customer.name}</span>
              <span className="ml-3 text-small text-neutral-500 font-mono">ID: {customer.id}</span>
            </div>
          </div>
        }
        description={`Phone: ${customer.phone} ${customer.email ? `• Email: ${customer.email}` : ''}`}
        actions={
          <Button icon={PlusCircle} onClick={() => setIsTopUpOpen(true)}>
            Top-Up Wallet
          </Button>
        }
      />

      <div className="p-8 flex flex-col gap-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 rounded-card p-5 shadow-1">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-body-sm font-medium">Wallet Balance</span>
              <Wallet size={18} className="text-green-500" />
            </div>
            <p className="text-h2 font-bold text-neutral-900">{formatUGX(customer.walletBalance ?? 0)}</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-card p-5 shadow-1">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-body-sm font-medium">Total Trips</span>
              <Truck size={18} className="text-blue-500" />
            </div>
            <p className="text-h2 font-bold text-neutral-900">{trips.length}</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-card p-5 shadow-1">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-body-sm font-medium">Total Spent</span>
              <Receipt size={18} className="text-amber-500" />
            </div>
            <p className="text-h2 font-bold text-neutral-900">{formatUGX(customer.totalSpent ?? 0)}</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-card p-5 shadow-1">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-body-sm font-medium">Account Created</span>
            </div>
            <p className="text-h3 font-semibold text-neutral-900">
              {customer.createdAt ? customer.createdAt.slice(0, 10) : '—'}
            </p>
          </div>
        </div>

        {/* Trips History Table */}
        <div className="bg-white border border-neutral-200 rounded-card p-6 shadow-1">
          <h2 className="text-h3 text-neutral-900 mb-4">Trip History</h2>
          <DataTable
            columns={[
              { key: 'id', header: 'Trip ID', render: (r) => <span className="font-mono text-small">{r.id}</span> },
              { key: 'route', header: 'Route', render: (r) => `${r.origin} → ${r.destination}` },
              { key: 'fare', header: 'Fare', render: (r) => formatUGX(r.fare) },
              { key: 'driver', header: 'Driver', render: (r) => r.driverName || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge tone={STATUS_TONE[r.status] || 'neutral'} label={r.status} /> },
              { key: 'created', header: 'Date', render: (r) => (r.createdAt ? r.createdAt.slice(0, 10) : '—') },
            ]}
            rows={trips}
            emptyTitle="No trips found"
            emptyDescription="This customer has not placed any trip requests yet."
          />
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-neutral-200 rounded-card p-6 shadow-1">
          <h2 className="text-h3 text-neutral-900 mb-4">Transaction History</h2>
          <DataTable
            columns={[
              { key: 'title', header: 'Description', render: (r) => r.title },
              { key: 'subtitle', header: 'Details', render: (r) => r.subtitle || '—' },
              {
                key: 'amount',
                header: 'Amount',
                render: (r) => (
                  <span className={r.direction === 'credit' ? 'text-green-700 font-semibold' : 'text-neutral-900 font-semibold'}>
                    {r.direction === 'credit' ? '+' : '-'}{formatUGX(r.amount)}
                  </span>
                ),
              },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge tone={r.status === 'success' ? 'success' : 'danger'} label={r.status} /> },
              { key: 'created', header: 'Date', render: (r) => (r.createdAt ? r.createdAt.slice(0, 10) : '—') },
            ]}
            rows={transactions}
            emptyTitle="No transactions found"
            emptyDescription="No transaction history recorded for this customer."
          />
        </div>
      </div>

      {/* TOP-UP WALLET MODAL */}
      <Modal
        open={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        title={`Top-Up Wallet: ${customer.name}`}
        size="sm"
      >
        <form onSubmit={handleTopUp} className="flex flex-col gap-4 pt-2">
          <p className="text-body-sm text-neutral-600">
            Enter the amount to credit to <strong>{customer.name}</strong>&apos;s wallet balance. Current balance is{' '}
            <strong>{formatUGX(customer.walletBalance ?? 0)}</strong>.
          </p>

          <TextField
            label="Credit Amount (UGX)"
            type="number"
            placeholder="e.g. 50000"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
            <Button variant="secondary" onClick={() => setIsTopUpOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Credit Wallet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
