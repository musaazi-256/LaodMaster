import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from '../layout/AdminPageHeader';
import FilterBar from '../../components/admin/FilterBar';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import { api } from '../../lib/api';
import { getTruckTier } from '../../mock-data/truckTiers';
import { formatUGX } from '../../lib/format';

const STATUS_TONE = { completed: 'success', cancelled: 'danger', accepted: 'info', requested: 'neutral' };

export default function TripsList() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let alive = true;
    api.adminTrips().then((r) => alive && setTrips(r.trips));
    return () => { alive = false; };
  }, []);

  const rows = (trips ?? []).filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search && !`${t.origin} ${t.destination} ${t.customerName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <AdminPageHeader title="Trips" description="All trip activity across the platform" />
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
                { value: 'requested', label: 'Requested' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ],
            },
          ]}
          onFilterChange={(_, value) => setStatusFilter(value)}
        />
        <DataTable
          loading={!trips}
          columns={[
            { key: 'id', header: 'Trip ID' },
            { key: 'route', header: 'Route', render: (r) => `${r.origin} → ${r.destination}` },
            { key: 'customer', header: 'Customer', render: (r) => r.customerName ?? '—' },
            { key: 'truck', header: 'Truck', render: (r) => getTruckTier(r.truckTierId)?.name ?? '—' },
            { key: 'fare', header: 'Fare', render: (r) => formatUGX(r.fare) },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
          ]}
          rows={rows}
          onRowClick={(r) => navigate(`/admin/trips/${r.id}`)}
          emptyTitle="No trips yet"
          emptyDescription="Trips will show up here once a customer requests one."
        />
      </div>
    </div>
  );
}
