import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import PaymentMethodSelector from '../../components/payments/PaymentMethodSelector';
import Button from '../../components/actions/Button';
import { formatUGX } from '../../lib/format';

export default function PaymentMethodScreen() {
  const navigate = useNavigate();
  const { customer } = useAppState();
  const { draft, updateDraft, paymentMethods, fareForDraft, confirmTrip } = customer;
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    await confirmTrip();
    navigate('/customer/request/searching');
  }

  return (
    <ScreenFrame
      title="Payment method"
      onBack={() => navigate(-1)}
      footer={
        <Button size="lg" fullWidth loading={submitting} onClick={handleConfirm}>
          Confirm & request truck · {formatUGX(fareForDraft)}
        </Button>
      }
    >
      {paymentMethods.length > 0 ? (
        <PaymentMethodSelector
          methods={paymentMethods}
          selectedId={draft.paymentMethodId}
          onSelect={(id) => updateDraft({ paymentMethodId: id })}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-neutral-500">
            No saved payment method yet — this trip will be marked as cash unless you add one.
          </p>
          <Button variant="secondary" icon={Plus} onClick={() => navigate('/customer/wallet/add-method')} className="self-start">
            Add payment method
          </Button>
        </div>
      )}
    </ScreenFrame>
  );
}
