import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function LocationPickerScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const field = params.get('field') === 'pickup' ? 'pickup' : 'destination';

  useEffect(() => {
    navigate(`/customer/request?field=${field}`, { replace: true });
  }, [field, navigate]);

  return null;
}
