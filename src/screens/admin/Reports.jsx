import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import AdminPageHeader from '../layout/AdminPageHeader';
import ChartCard from '../../components/admin/ChartCard';
import Button from '../../components/actions/Button';
import { api } from '../../lib/api';
import { TRUCK_TIERS } from '../../mock-data/truckTiers';

const STATUS_LABELS = { verified: 'Verified', pending: 'Pending', unverified: 'Unverified', rejected: 'Rejected' };

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    api.adminReports().then((r) => alive && setData(r));
    return () => { alive = false; };
  }, []);

  const tripsByTier = TRUCK_TIERS.map((tier) => ({
    label: tier.name.replace('-', '‑').slice(0, 8),
    value: data?.tripsByTier.find((t) => t.truckTierId === tier.id)?.count ?? 0,
  }));

  const driversByStatus = (data?.driversByStatus ?? []).map((s) => ({
    label: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        description="Operational trends across trucks and drivers"
        actions={<Button variant="secondary" icon={Download}>Export CSV</Button>}
      />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Truck category distribution" subtitle="All-time trips by tier" type="bar" data={tripsByTier} />
        <ChartCard title="Driver verification breakdown" subtitle="All registered drivers" type="bar" data={driversByStatus.length ? driversByStatus : [{ label: 'No drivers yet', value: 0 }]} />
      </div>
    </div>
  );
}
