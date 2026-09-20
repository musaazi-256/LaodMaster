import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Wallet, Users, UserCheck, Radio, ShieldCheck, Clock } from 'lucide-react';
import AdminPageHeader from '../layout/AdminPageHeader';
import MetricCard from '../../components/admin/MetricCard';
import ChartCard from '../../components/admin/ChartCard';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import { getTruckTier } from '../../mock-data/truckTiers';
import { api } from '../../lib/api';
import { formatUGX } from '../../lib/format';

const STATUS_TONE = { success: 'success', pending: 'warning', failed: 'danger', refunded: 'info' };

function ProgressRow({ label, value, total, tone = 'bg-green-500' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold text-neutral-900">{value}</span>
      </div>
      <div className="h-2 rounded-pill bg-neutral-100 overflow-hidden">
        <div className={`h-full rounded-pill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    api.adminDashboard().then((r) => alive && setData(r));
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Overview of LoadMastr operations" />
      <div className="p-8 flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Trips" value={data ? data.metrics.totalTrips.toLocaleString() : '—'} icon={Truck} />
          <MetricCard label="Revenue" value={data ? formatUGX(data.metrics.revenue) : '—'} icon={Wallet} />
          <MetricCard label="Total Drivers" value={data ? data.metrics.totalDrivers.toLocaleString() : '—'} icon={UserCheck} />
          <MetricCard label="Customers" value={data ? data.metrics.customers.toLocaleString() : '—'} icon={Users} />
        </div>

        <div>
          <p className="text-label text-neutral-500 mb-3">Driver status</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard label="Online now" value={data ? data.metrics.activeDrivers.toLocaleString() : '—'} icon={Radio} />
            <MetricCard label="Verified" value={data ? data.metrics.verifiedDrivers.toLocaleString() : '—'} icon={ShieldCheck} />
            <MetricCard label="Pending verification" value={data ? data.metrics.pendingVerification.toLocaleString() : '—'} icon={Clock} />
          </div>
        </div>

        <div>
          <p className="text-label text-neutral-500 mb-3">Trip status</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard label="Total requested" value={data ? data.tripStatusCounts.totalRequested.toLocaleString() : '—'} />
            <MetricCard label="Awaiting driver" value={data ? data.tripStatusCounts.requested.toLocaleString() : '—'} />
            <MetricCard label="Accepted" value={data ? data.tripStatusCounts.accepted.toLocaleString() : '—'} />
            <MetricCard label="Completed" value={data ? data.tripStatusCounts.completed.toLocaleString() : '—'} />
            <MetricCard label="Cancelled" value={data ? data.tripStatusCounts.cancelled.toLocaleString() : '—'} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Trips overview" subtitle="Last 7 days" type="bar" data={data?.dailyTrips ?? []} />
          <ChartCard title="Revenue" subtitle="Last 7 days (completed trips)" type="line" data={data?.dailyRevenue ?? []} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-label text-neutral-900">Recent driver activity</p>
              <button type="button" onClick={() => navigate('/admin/drivers')} className="text-body-sm text-green-700 font-medium">
                View all
              </button>
            </div>
            <DataTable
              loading={!data}
              columns={[
                {
                  key: 'name',
                  header: 'Driver',
                  render: (r) => (
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-green-100 text-green-700 text-small font-semibold">
                        {r.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{r.name}</p>
                        <p className="text-small text-neutral-500 truncate">
                          {getTruckTier(r.truckTierId)?.name ?? r.vehicleModel ?? '—'} · {r.tripCount} trips
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => <StatusBadge tone={r.isOnline ? 'success' : 'neutral'} label={r.isOnline ? 'Online' : 'Offline'} />,
                },
                { key: 'earned', header: 'Earned', render: (r) => formatUGX(r.totalEarned) },
              ]}
              rows={data?.recentDrivers ?? []}
              emptyTitle="No drivers yet"
              emptyDescription="Driver activity will show up here as drivers sign up and go online."
            />
          </div>

          <div className="rounded-card border border-neutral-200 bg-white p-5 flex flex-col gap-5">
            <p className="text-label text-neutral-900">Approval status</p>
            <ProgressRow
              label="Pending approvals"
              value={data ? data.metrics.pendingVerification : 0}
              total={data ? data.metrics.totalDrivers : 0}
              tone="bg-amber-500"
            />
            <ProgressRow
              label="Verified drivers"
              value={data ? data.metrics.verifiedDrivers : 0}
              total={data ? data.metrics.totalDrivers : 0}
            />
            {data && data.metrics.totalDrivers === 0 && (
              <p className="text-small text-neutral-500">No drivers registered yet.</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-label text-neutral-900">Recent transactions</p>
            <button type="button" onClick={() => navigate('/admin/transactions')} className="text-body-sm text-green-700 font-medium">
              View all
            </button>
          </div>
          <DataTable
            loading={!data}
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'title', header: 'Description' },
              { key: 'amount', header: 'Amount', render: (r) => formatUGX(r.amount) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
            ]}
            rows={data?.recentTransactions ?? []}
            emptyTitle="No transactions yet"
            emptyDescription="Transactions will show up here as real trips are paid for."
          />
        </div>
      </div>
    </div>
  );
}
