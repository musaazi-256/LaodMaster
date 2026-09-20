import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import Button from '../../components/actions/Button';
import { useToast } from '../../components/feedback/ToastProvider';

export default function PaymentFailureRetry() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [retrying, setRetrying] = useState(false);

  function handleRetry() {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      showToast('Payment successful', 'success');
      navigate('/customer/wallet');
    }, 900);
  }

  return (
    <ScreenFrame title="Payment failed" onBack={() => navigate('/customer/wallet')}>
      <div className="flex flex-col items-center text-center gap-4 pt-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-red-500/10 text-red-500">
          <XCircle size={30} />
        </span>
        <div>
          <p className="text-h3 text-neutral-900">We couldn't process your payment</p>
          <p className="text-body-sm text-neutral-500 mt-1">
            Your mobile money provider declined the transaction. Check your balance and try again.
          </p>
        </div>
        <Button size="lg" fullWidth loading={retrying} onClick={handleRetry}>
          Retry payment
        </Button>
        <Button variant="tertiary" size="lg" fullWidth onClick={() => navigate('/customer/wallet/add-method')}>
          Use a different method
        </Button>
      </div>
    </ScreenFrame>
  );
}
