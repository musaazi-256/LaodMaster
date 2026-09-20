import { useState } from 'react';
import AdminPageHeader from '../layout/AdminPageHeader';
import Avatar from '../../components/identity/Avatar';
import StatusBadge from '../../components/admin/StatusBadge';
import Toggle from '../../components/forms/Toggle';
import Button from '../../components/actions/Button';
import { UserPlus } from 'lucide-react';

const ADMINS = [
  { id: 'a1', name: 'Iggy Musaazi', role: 'Owner', status: 'active' },
  { id: 'a2', name: 'Ruth Nabaggala', role: 'Operations', status: 'active' },
  { id: 'a3', name: 'Peter Ochieng', role: 'Support', status: 'invited' },
];

export default function AccessSettings() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [refundApproval, setRefundApproval] = useState(true);

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Team access and platform preferences"
        actions={<Button icon={UserPlus}>Invite admin</Button>}
      />
      <div className="p-8 flex flex-col gap-6 max-w-2xl">
        <div>
          <p className="text-label text-neutral-900 mb-3">Team access</p>
          <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
            {ADMINS.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar name={a.name} size="sm" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-body-sm text-neutral-900">{a.name}</span>
                  <span className="text-small text-neutral-500">{a.role}</span>
                </div>
                <StatusBadge tone={a.status === 'active' ? 'success' : 'warning'} label={a.status} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label text-neutral-900 mb-3">Platform preferences</p>
          <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-body-sm text-neutral-900">Require 2FA for admin logins</span>
              <Toggle checked={twoFactor} onChange={setTwoFactor} />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-body-sm text-neutral-900">Require approval for refunds over UGX 200,000</span>
              <Toggle checked={refundApproval} onChange={setRefundApproval} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
