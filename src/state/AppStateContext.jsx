import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { createLocalStorageSession } from './session';
import { getTruckTier } from '../mock-data/truckTiers';

export const TRACKING_STATES = [
  'searching',
  'driver_assigned',
  'driver_approaching',
  'driver_arrived',
  'trip_started',
  'en_route',
  'near_destination',
  'arrived',
  'completed',
];

const PHASE_ORDER = ['navigate_to_pickup', 'arrived_pickup', 'in_transit', 'arrived_destination'];
const TRACKING_FOR_PHASE = {
  navigate_to_pickup: 'driver_approaching',
  arrived_pickup: 'driver_arrived',
  in_transit: 'en_route',
  arrived_destination: 'arrived',
};
const PHASE_FOR_TRACKING = {
  driver_assigned: 'navigate_to_pickup',
  driver_approaching: 'navigate_to_pickup',
  driver_arrived: 'arrived_pickup',
  trip_started: 'in_transit',
  en_route: 'in_transit',
  near_destination: 'in_transit',
  arrived: 'arrived_destination',
  completed: 'arrived_destination',
};

const defaultSession = createLocalStorageSession('loadmastr:session');
const AppStateContext = createContext(null);

// Polls `fetchFn` every `intervalMs` while `enabled`, exposing the latest result and a
// manual `refetch` for instant feedback right after an action. This is what replaced
// the old in-memory "shared trip" trick from before the real backend existed — now
// every tab, window or device polling the same account sees the same server state, no
// special-casing needed for Live Demo vs standalone.
function usePoll(enabled, fetchFn, intervalMs, resetKey) {
  const [data, setData] = useState(null);
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  const refetch = useCallback(() => {
    if (!enabled) return Promise.resolve();
    return fnRef.current().then(setData).catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      return;
    }
    let alive = true;
    fnRef.current().then((result) => alive && setData(result)).catch(() => {});
    const id = setInterval(() => {
      fnRef.current().then((result) => alive && setData(result)).catch(() => {});
    }, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, resetKey]);

  return [data, refetch];
}

export function AppStateProvider({ children, session = defaultSession }) {
  // ---- Device Frame Demo Settings ----
  const [devicePlatform, setDevicePlatform] = useState('ios');

  // ---- Auth ----
  const [authUser, setAuthUser] = useState(() => session.get());
  const [authError, setAuthError] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);

  const isCustomer = authUser?.role === 'customer';
  const isDriver = authUser?.role === 'driver';

  const signup = useCallback(
    async (role, payload) => {
      setAuthBusy(true);
      setAuthError(null);
      try {
        const { user } = await api.signup({ role, ...payload });
        session.set(user);
        setAuthUser(user);
        return user;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      } finally {
        setAuthBusy(false);
      }
    },
    [session]
  );

  const login = useCallback(
    async (role, phone, password) => {
      setAuthBusy(true);
      setAuthError(null);
      try {
        const { user } = await api.login({ role, phone, password });
        session.set(user);
        setAuthUser(user);
        return user;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      } finally {
        setAuthBusy(false);
      }
    },
    [session]
  );

  const logout = useCallback(() => {
    session.clear();
    setAuthUser(null);
  }, [session]);

  const deleteAccount = useCallback(async () => {
    if (!authUser) return;
    await api.deleteAccount(authUser.id);
    session.clear();
    setAuthUser(null);
  }, [authUser, session]);

  // ---- Customer ----
  const [customerProfile, refetchCustomerProfile] = usePoll(
    isCustomer,
    () => api.getCustomer(authUser.id).then((r) => r.customer),
    3000,
    authUser?.id
  );
  const [customerActiveTrip, refetchCustomerActiveTrip] = usePoll(
    isCustomer,
    () => api.activeTrip('customer', authUser.id).then((r) => r.trip),
    2000,
    authUser?.id
  );
  const [customerTripsData, refetchCustomerTrips] = usePoll(
    isCustomer,
    () => api.tripHistory('customer', authUser.id).then((r) => r.trips),
    4000,
    authUser?.id
  );
  const [customerTransactionsData, refetchCustomerTransactions] = usePoll(
    isCustomer,
    () => api.listTransactions(authUser.id).then((r) => r.transactions),
    4000,
    authUser?.id
  );
  const [paymentMethodsData, refetchPaymentMethods] = usePoll(
    isCustomer,
    () => api.listPaymentMethods(authUser.id).then((r) => r.paymentMethods),
    5000,
    authUser?.id
  );

  const [requestDraft, setRequestDraft] = useState({
    mode: 'search',
    pickup: null,
    destination: null,
    cargoCategory: null,
    truckTierId: null,
    paymentMethodId: null,
  });

  const updateDraft = useCallback((partial) => setRequestDraft((d) => ({ ...d, ...partial })), []);
  const resetDraft = useCallback(() => {
    setRequestDraft({ mode: 'search', pickup: null, destination: null, cargoCategory: null, truckTierId: null, paymentMethodId: null });
  }, []);

  const fareForDraft = useMemo(() => {
    const base = { small: 40000, 'small-medium': 70000, medium: 120000, large: 240000, 'extra-large': 420000 };
    return base[requestDraft.truckTierId] || 70000;
  }, [requestDraft.truckTierId]);

  const recentDestinations = useMemo(() => {
    const trips = customerTripsData ?? [];
    const seen = new Map();
    for (const trip of trips) {
      for (const label of [trip.destination, trip.origin]) {
        if (label && !seen.has(label)) seen.set(label, { id: label, label, subtitle: '' });
      }
    }
    return Array.from(seen.values()).slice(0, 5);
  }, [customerTripsData]);

  const confirmTrip = useCallback(async () => {
    const { trip } = await api.createTrip({
      customerId: authUser.id,
      origin: requestDraft.pickup?.label || 'Current location',
      destination: requestDraft.destination?.label || 'Destination',
      cargoCategory: requestDraft.cargoCategory,
      truckTierId: requestDraft.truckTierId,
      fare: fareForDraft,
      paymentMethodId: requestDraft.paymentMethodId,
    });
    await refetchCustomerActiveTrip();
    return trip;
  }, [authUser, requestDraft, fareForDraft, refetchCustomerActiveTrip]);

  const advanceTracking = useCallback(
    async (tripId, currentState) => {
      const idx = TRACKING_STATES.indexOf(currentState);
      const next = TRACKING_STATES[Math.min(idx + 1, TRACKING_STATES.length - 1)];
      await api.updateTracking(tripId, next);
    },
    []
  );

  const cancelTrip = useCallback(async (tripId) => {
    await api.cancelTrip(tripId);
    await refetchCustomerActiveTrip();
  }, [refetchCustomerActiveTrip]);

  const topUpWallet = useCallback(
    async (amount, method) => {
      await api.topUp(authUser.id, amount, method ?? 'Mobile Money');
      await Promise.all([refetchCustomerProfile(), refetchCustomerTransactions()]);
    },
    [authUser, refetchCustomerProfile, refetchCustomerTransactions]
  );

  const withdrawFromWallet = useCallback(
    async (amount, method) => {
      await api.withdraw(authUser.id, amount, method ?? 'Mobile Money');
      await Promise.all([refetchCustomerProfile(), refetchCustomerTransactions()]);
    },
    [authUser, refetchCustomerProfile, refetchCustomerTransactions]
  );

  const addPaymentMethod = useCallback(
    async (method) => {
      await api.addPaymentMethod({ userId: authUser.id, ...method });
      await refetchPaymentMethods();
    },
    [authUser, refetchPaymentMethods]
  );

  const updateCustomerProfile = useCallback(
    async (payload) => {
      await api.updateCustomerProfile(authUser.id, payload);
      await refetchCustomerProfile();
    },
    [authUser, refetchCustomerProfile]
  );

  // ---- Driver ----
  const [driverProfile, refetchDriverProfile] = usePoll(
    isDriver,
    () => api.getDriver(authUser.id).then((r) => r.driver),
    3000,
    authUser?.id
  );
  const [driverDocumentsData, refetchDriverDocuments] = usePoll(
    isDriver,
    () => api.getDriver(authUser.id).then((r) => r.documents),
    3000,
    authUser?.id
  );
  const [driverActiveTripRaw, refetchDriverActiveTrip] = usePoll(
    isDriver,
    () => api.activeTrip('driver', authUser.id).then((r) => r.trip),
    2000,
    authUser?.id
  );
  const [driverTripsData, refetchDriverTrips] = usePoll(
    isDriver,
    () => api.tripHistory('driver', authUser.id).then((r) => r.trips),
    4000,
    authUser?.id
  );
  const [driverTransactionsData, refetchDriverTransactions] = usePoll(
    isDriver,
    () => api.listTransactions(authUser.id).then((r) => r.transactions),
    4000,
    authUser?.id
  );

  const canReceiveRequests = isDriver && driverProfile?.isOnline && !driverActiveTripRaw;
  const [dismissedRequestId, setDismissedRequestId] = useState(null);
  const [incomingRequestRaw, refetchIncomingRequest] = usePoll(
    canReceiveRequests,
    () => api.nextRequest().then((r) => r.trip),
    2000,
    authUser?.id
  );
  const incomingRequest = incomingRequestRaw && incomingRequestRaw.id !== dismissedRequestId ? incomingRequestRaw : null;

  const driverActiveTrip = useMemo(() => {
    if (!driverActiveTripRaw) return null;
    return {
      ...driverActiveTripRaw,
      phase: PHASE_FOR_TRACKING[driverActiveTripRaw.trackingState] || 'navigate_to_pickup',
      customer: { name: driverActiveTripRaw.customerName },
    };
  }, [driverActiveTripRaw]);

  const goOnline = useCallback(async () => {
    await api.setDriverOnline(authUser.id, true);
    setDismissedRequestId(null);
    await refetchDriverProfile();
  }, [authUser, refetchDriverProfile]);

  const goOffline = useCallback(async () => {
    await api.setDriverOnline(authUser.id, false);
    await refetchDriverProfile();
  }, [authUser, refetchDriverProfile]);

  const acceptRequest = useCallback(async () => {
    if (!incomingRequestRaw) return;
    await api.acceptTrip(incomingRequestRaw.id, authUser.id);
    await refetchDriverActiveTrip();
    await refetchIncomingRequest();
  }, [incomingRequestRaw, authUser, refetchDriverActiveTrip, refetchIncomingRequest]);

  const declineRequest = useCallback(() => {
    setDismissedRequestId(incomingRequestRaw?.id ?? null);
  }, [incomingRequestRaw]);

  const advanceDriverPhase = useCallback(async () => {
    if (!driverActiveTripRaw) return;
    const currentPhase = PHASE_FOR_TRACKING[driverActiveTripRaw.trackingState] || 'navigate_to_pickup';
    const idx = PHASE_ORDER.indexOf(currentPhase);
    const nextPhase = PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
    await api.updateTracking(driverActiveTripRaw.id, TRACKING_FOR_PHASE[nextPhase]);
    await refetchDriverActiveTrip();
  }, [driverActiveTripRaw, refetchDriverActiveTrip]);

  const completeDriverTrip = useCallback(
    async (rating) => {
      if (!driverActiveTripRaw) return;
      await api.completeTrip(driverActiveTripRaw.id, rating);
      await Promise.all([refetchDriverProfile(), refetchDriverTrips(), refetchDriverTransactions(), refetchDriverActiveTrip()]);
    },
    [driverActiveTripRaw, refetchDriverProfile, refetchDriverTrips, refetchDriverTransactions, refetchDriverActiveTrip]
  );

  const withdraw = useCallback(
    async (amount, method) => {
      await api.withdraw(authUser.id, amount, method);
      await Promise.all([refetchDriverProfile(), refetchDriverTransactions()]);
    },
    [authUser, refetchDriverProfile, refetchDriverTransactions]
  );

  const registerVehicle = useCallback(
    async (payload) => {
      await api.registerVehicle(authUser.id, payload);
      await refetchDriverProfile();
    },
    [authUser, refetchDriverProfile]
  );

  const uploadDocument = useCallback(
    async (docType) => {
      await api.uploadDocument(authUser.id, { docType });
      await refetchDriverDocuments();
    },
    [authUser, refetchDriverDocuments]
  );

  const submitForReview = useCallback(async () => {
    await api.submitForReview(authUser.id);
    await refetchDriverProfile();
  }, [authUser, refetchDriverProfile]);

  const updateDriverProfile = useCallback(
    async (payload) => {
      await api.updateDriverProfile(authUser.id, payload);
      await refetchDriverProfile();
    },
    [authUser, refetchDriverProfile]
  );

  const customerProfileResolved = customerProfile || (isCustomer ? authUser : null);
  const driverProfileResolved = driverProfile || (isDriver ? authUser : null);

  const value = useMemo(
    () => ({
      auth: { user: authUser, error: authError, busy: authBusy, signup, login, logout, deleteAccount },
      customer: {
        profile: customerProfileResolved,
        wallet: customerProfileResolved?.walletBalance ?? customerProfileResolved?.wallet_balance ?? 0,
        transactions: customerTransactionsData ?? [],
        paymentMethods: paymentMethodsData ?? [],
        trips: customerTripsData ?? [],
        recentDestinations,
        draft: requestDraft,
        updateDraft,
        resetDraft,
        fareForDraft,
        activeTrip: customerActiveTrip,
        refetchActiveTrip: refetchCustomerActiveTrip,
        confirmTrip,
        advanceTracking,
        cancelTrip,
        topUpWallet,
        withdraw: withdrawFromWallet,
        addPaymentMethod,
        updateProfile: updateCustomerProfile,
      },
      driver: {
        profile: driverProfileResolved,
        documents: driverDocumentsData ?? [],
        trips: driverTripsData ?? [],
        transactions: driverTransactionsData ?? [],
        incomingRequest,
        activeTrip: driverActiveTrip,
        goOnline,
        goOffline,
        acceptRequest,
        declineRequest,
        advanceDriverPhase,
        completeDriverTrip,
        registerVehicle,
        uploadDocument,
        submitForReview,
        updateProfile: updateDriverProfile,
        withdraw,
      },
      getTruckTier,
      devicePlatform,
      setDevicePlatform,
    }),
    [
      devicePlatform, setDevicePlatform,
      authUser, authError, authBusy, signup, login, logout, deleteAccount,
      customerProfileResolved, customerTransactionsData, paymentMethodsData, customerTripsData, recentDestinations,
      requestDraft, updateDraft, resetDraft, fareForDraft, customerActiveTrip, refetchCustomerActiveTrip,
      confirmTrip, advanceTracking, cancelTrip, topUpWallet, withdrawFromWallet, addPaymentMethod, updateCustomerProfile,
      driverProfileResolved, driverDocumentsData, driverTripsData, driverTransactionsData, incomingRequest, driverActiveTrip,
      goOnline, goOffline, acceptRequest, declineRequest, advanceDriverPhase, completeDriverTrip,
      registerVehicle, uploadDocument, submitForReview, updateDriverProfile, withdraw,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
