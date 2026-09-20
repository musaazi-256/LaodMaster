// TODO(Iggy): confirm these bands against the real backend's truck-registration validation
// before this goes anywhere near production. Two candidate sets are on file — using
// Set B (foundation doc) as the default; swap here if Set A (original brief) is correct.
export const TRUCK_TIERS = [
  {
    id: 'small',
    name: 'Small',
    tonnageRange: '≤ 1t',
    minTon: 0,
    maxTon: 1,
    icon: 'small.svg',
    description: 'Light loads, small pickups and parcels',
  },
  {
    id: 'small-medium',
    name: 'Small-Medium',
    tonnageRange: '1 – 3t',
    minTon: 1,
    maxTon: 3,
    icon: 'small-medium.svg',
    description: 'Household moves, retail restocking',
  },
  {
    id: 'medium',
    name: 'Medium',
    tonnageRange: '3 – 7t',
    minTon: 3,
    maxTon: 7,
    icon: 'medium.svg',
    description: 'Construction materials, bulk goods',
  },
  {
    id: 'large',
    name: 'Large',
    tonnageRange: '7 – 12t',
    minTon: 7,
    maxTon: 12,
    icon: 'large.svg',
    description: 'Heavy freight, multi-site deliveries',
  },
  {
    id: 'extra-large',
    name: 'Extra Large',
    tonnageRange: '12t+',
    minTon: 12,
    maxTon: null,
    icon: 'extra-large.svg',
    description: 'Container and long-haul cargo',
  },
];

export function getTruckTier(id) {
  return TRUCK_TIERS.find((tier) => tier.id === id);
}
