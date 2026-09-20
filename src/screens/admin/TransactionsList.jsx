import { useEffect, useState } from 'react';
import AdminPageHeader from '../layout/AdminPageHeader';
import FilterBar from '../../components/admin/FilterBar';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/feedback/Modal';
import RefundCard from '../../components/payments/RefundCard';
import Button from '../../components/actions/Button';
import { api } from '../../lib/api';
import { formatUGX } from '../../lib/format';
import { useToast } from '../../components/feedback/ToastProvider';

const STATUS_TONE = { success: 'success', pending: 'warning', failed: 'danger', refunded: 'info' };

export default function TransactionsList() {
  const showToast = useToast();
  const [transactions, setTransactions] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [refunding, setRefunding] = useState(false);

  function load() {
    api.adminTransactions().then((r) => setTransactions(r.transactions));
  }
  useEffect(load, []);

  const rows = (transactions ?? []).filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleRefund() {
    setRefunding(true);
    await api.refundTransaction(selected.id);
    setRefunding(false);
    showToast(`Refund issued for ${selected.id.toUpperCase()}`, 'success');
    setSelected(null);
    load();
  }

  return (
    <div>
      <AdminPageHeader title="Transactions" description="All customer and driver payment activity" />
      <div className="p-8 flex flex-col gap-4">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              id: 'status',
              label: 'Status',
              value: statusFilter,
              options: [
                { value: 'success', label: 'Successful' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ],
            },
          ]}
          onFilterChange={(_, value) => setStatusFilter(value)}
        />

        <DataTable
          loading={!transactions}
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'title', header: 'Description' },
            { key: 'subtitle', header: 'Date & method' },
            { key: 'amount', header: 'Amount', render: (r) => formatUGX(r.amount) },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
          ]}
          rows={rows}
          onRowClick={setSelected}
          emptyTitle="No transactions match your filters"
        />
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Transaction details"
        footer={
          selected?.status !== 'refunded' && (
            <>
              <Button variant="tertiary" onClick={() => setSelected(null)}>Close</Button>
              <Button variant="danger" loading={refunding} onClick={handleRefund}>Issue refund</Button>
            </>
          )
        }
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-neutral-500">{selected.subtitle}</span>
              <StatusBadge tone={STATUS_TONE[selected.status]} label={selected.status} />
            </div>
            <p className="text-h3 text-neutral-900">{formatUGX(selected.amount)}</p>
            <p className="text-body-sm text-neutral-600">{selected.title}</p>
            <RefundCard amount={selected.amount} status={selected.status === 'refunded' ? 'refunded' : 'pending'} reason="Initiated by admin review." />
          </div>
        )}
      </Modal>
    </div>
  );
}
