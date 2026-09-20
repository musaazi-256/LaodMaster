function formatDate(iso) {
  // SQLite datetime('now') gives 'YYYY-MM-DD HH:MM:SS' UTC — good enough for a local prototype.
  if (!iso) return null;
  const [datePart] = iso.split(' ');
  const [y, m, d] = datePart.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

export function serializeUser(row) {
  if (!row) return null;
  const base = {
    id: row.id,
    role: row.role,
    name: row.name,
    phone: row.phone,
    email: row.email,
    walletBalance: row.wallet_balance,
    referralCode: row.referral_code,
  };
  if (row.role === 'driver') {
    return {
      ...base,
      vehicleModel: row.vehicle_model,
      plateNumber: row.plate_number,
      truckTierId: row.truck_tier_id,
      verificationStatus: row.verification_status,
      vehicleVerificationStatus: row.vehicle_verification_status,
      isOnline: !!row.is_online,
      cashDue: row.cash_due,
      rating: row.rating,
      tripCount: row.trip_count,
    };
  }
  return base;
}

export function driverSnapshot(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    rating: row.rating,
    tripCount: row.trip_count,
    vehicleModel: row.vehicle_model,
    plateNumber: row.plate_number,
  };
}

export function serializeTrip(row, { driverRow, customerName } = {}) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: customerName ?? row.customer_name ?? null,
    driverId: row.driver_id,
    driver: driverRow ? driverSnapshot(driverRow) : null,
    origin: row.origin,
    destination: row.destination,
    cargoCategory: row.cargo_category,
    truckTierId: row.truck_tier_id,
    fare: row.fare,
    paymentMethodId: row.payment_method_id,
    trackingState: row.tracking_state,
    status: row.status,
    rating: row.rating,
    etaMinutes: row.eta_minutes,
    distanceKm: row.distance_km,
    date: formatDate(row.created_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Shape used by TripCard / trip history lists.
export function serializeTripSummary(row, { driverName, customerName } = {}) {
  return {
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    truckTierId: row.truck_tier_id,
    driverName: driverName ?? null,
    customerName: customerName ?? null,
    fare: row.fare,
    status: row.status,
    date: formatDate(row.created_at),
    createdAt: row.created_at,
  };
}

export function serializeTransaction(row) {
  return {
    id: row.id,
    direction: row.direction,
    title: row.title,
    subtitle: row.subtitle,
    amount: row.amount,
    status: row.status,
    tripId: row.trip_id,
    createdAt: row.created_at,
  };
}

export function serializePaymentMethod(row) {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    detail: row.detail,
    isDefault: !!row.is_default,
  };
}

export function serializeDocument(row) {
  return {
    id: row.id,
    docType: row.doc_type,
    status: row.status,
    fileName: row.file_name,
  };
}
