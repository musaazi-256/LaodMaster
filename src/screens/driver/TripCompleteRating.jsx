import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle2 } from 'lucide-react';
import { useAppState } from '../../state/AppStateContext';
import Button from '../../components/actions/Button';
import { formatUGX } from '../../lib/format';
import { cx } from '../../lib/cx';

export default function TripCompleteRating() {
  const navigate = useNavigate();
  const { driver } = useAppState();
  const { activeTrip, completeDriverTrip } = driver;
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!activeTrip && !leavingRef.current) navigate('/driver', { replace: true });
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  async function handleSubmit() {
    leavingRef.current = true;
    setSubmitting(true);
    // Await completion before navigating so Dashboard's `if (activeTrip) navigate(...)`
    // guard sees the trip already cleared, instead of bouncing through /driver/trip
    // while the request is still in flight.
    await completeDriverTrip(rating);
    navigate('/driver');
  }

  return (
    <div className="flex flex-col h-full min-h-0 items-center justify-center px-6 gap-5 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-green-50 text-green-700">
        <CheckCircle2 size={30} />
      </span>
      <div>
        <p className="text-h3 text-neutral-900">Trip completed</p>
        <p className="text-body-sm text-neutral-500 mt-1">You earned {formatUGX(Math.round(activeTrip.fare * 0.85))}</p>
      </div>

      <div>
        <p className="text-label text-neutral-900 mb-2">Rate {activeTrip.customer?.name}</p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star size={30} className={cx(n <= rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-200')} />
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" fullWidth loading={submitting} onClick={handleSubmit}>
        Done
      </Button>
    </div>
  );
}
