import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminPageHeader from '../layout/AdminPageHeader';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import Avatar from '../../components/identity/Avatar';
import RatingStars from '../../components/identity/RatingStars';
import DriverVerificationBadge from '../../components/identity/DriverVerificationBadge';
import VehicleVerificationBadge from '../../components/identity/VehicleVerificationBadge';
import DocumentUploadCard from '../../components/identity/DocumentUploadCard';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Button from '../../components/actions/Button';
import ErrorState from '../../components/feedback/ErrorState';
import { api } from '../../lib/api';
import { getTruckTier } from '../../mock-data/truckTiers';
import { formatUGX } from '../../lib/format';
import { useToast } from '../../components/feedback/ToastProvider';

const DOC_LABELS = { license: 'Driving permit', logbook: 'Vehicle logbook', insurance: 'Insurance certificate', photo: 'Vehicle photo' };

export default function DriverDetail() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    api.getDriver(id)
      .then((r) => { setDriver(r.driver); setDocuments(r.documents); })
      .catch(() => setNotFound(true));
    api.adminTrips().then((r) => setTrips(r.trips));
  }
  useEffect(load, [id]);

  async function handleVerify(status) {
    setBusy(true);
    await api.verifyDriver(id, status);
    setBusy(false);
    showToast(status === 'verified' ? 'Driver approved' : 'Driver application rejected', status === 'verified' ? 'success' : 'warning');
    load();
  }

  if (notFound) {
    return (
      <div>
        <AdminPageHeader title="Driver not found" />
        <div className="p-8"><ErrorState title="Driver not found" /></div>
      </div>
    );
  }
  if (!driver) return null;

  const tier = getTruckTier(driver.truckTierId);
  const driverTrips = trips.filter((t) => t.driverName === driver.name);
  const isPending = driver.verificationStatus === 'pending';

  return (
    <div>
      <AdminPageHeader
        title={driver.name}
        actions={<Button variant="secondary" onClick={() => navigate('/admin/drivers')}>Back to drivers</Button>}
      />
      <div className="p-8 flex flex-col gap-6">
        <Breadcrumbs items={[{ label: 'Drivers', to: '/admin/drivers' }, { label: driver.name }]} />

        {isPending && (
          <div className="rounded-card border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-label text-neutral-900">Verification pending</p>
              <p className="text-body-sm text-neutral-500">This driver submitted documents and is waiting for review.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="danger" loading={busy} onClick={() => handleVerify('rejected')}>Reject</Button>
              <Button loading={busy} onClick={() => handleVerify('verified')}>Approve</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 rounded-card border border-neutral-200 bg-white p-5 flex flex-col items-center text-center gap-3">
            <Avatar name={driver.name} size="lg" />
            <p className="text-h4 text-neutral-900">{driver.name}</p>
            <p className="text-body-sm text-neutral-500">{driver.phone}</p>
            <RatingStars rating={driver.rating} count={driver.tripCount} />
            <div className="flex flex-col gap-2 w-full mt-2">
              <DriverVerificationBadge status={driver.verificationStatus === 'rejected' ? 'unverified' : driver.verificationStatus} className="justify-center" />
              <VehicleVerificationBadge status={driver.vehicleVerificationStatus === 'rejected' ? 'unverified' : driver.vehicleVerificationStatus} className="justify-center" />
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="rounded-card border border-neutral-200 bg-white p-5 flex flex-col gap-3">
              <p className="text-label text-neutral-900">Vehicle</p>
              <div className="grid grid-cols-2 gap-4 text-body-sm">
                <div>
                  <p className="text-neutral-500">Vehicle</p>
                  <p className="text-neutral-900 font-medium">{driver.vehicleModel ?? 'Not registered'}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Number plate</p>
                  <p className="text-neutral-900 font-medium">{driver.plateNumber ?? '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Truck category</p>
                  <p className="text-neutral-900 font-medium">{tier ? `${tier.name} · ${tier.tonnageRange}` : '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Wallet balance</p>
                  <p className="text-neutral-900 font-medium">{formatUGX(driver.walletBalance)}</p>
                </div>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="rounded-card border border-neutral-200 bg-white p-5 flex flex-col gap-3">
                <p className="text-label text-neutral-900">Submitted documents</p>
                <div className="grid grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <DocumentUploadCard key={doc.id} label={DOC_LABELS[doc.docType] ?? doc.docType} status="uploaded" fileName={doc.fileName} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-label text-neutral-900 mb-3">Trip history</p>
          <DataTable
            columns={[
              { key: 'id', header: 'Trip ID' },
              { key: 'route', header: 'Route', render: (r) => `${r.origin} → ${r.destination}` },
              { key: 'fare', header: 'Fare', render: (r) => formatUGX(r.fare) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge tone={r.status === 'completed' ? 'success' : r.status === 'cancelled' ? 'danger' : 'info'} label={r.status} /> },
            ]}
            rows={driverTrips}
            emptyTitle="No trips yet"
          />
        </div>
      </div>
    </div>
  );
}
