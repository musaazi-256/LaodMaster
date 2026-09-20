import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TRUCK_TIERS } from '../../mock-data/truckTiers';
import TruckCard from './TruckCard';
import Button from '../actions/Button';

export default function TruckSelector({ selectedTierId, onSelect, fareByTier = {}, recommendedTierId, collapsible = true }) {
  const [expanded, setExpanded] = useState(!collapsible);

  const visibleTiers = expanded ? TRUCK_TIERS : TRUCK_TIERS.slice(0, 2);

  return (
    <div className="flex flex-col gap-2.5">
      {visibleTiers.map((tier) => (
        <TruckCard
          key={tier.id}
          tier={tier}
          selected={tier.id === selectedTierId}
          recommended={tier.id === recommendedTierId}
          estimatedFare={fareByTier[tier.id]}
          onSelect={() => onSelect?.(tier.id)}
        />
      ))}
      {collapsible && (
        <Button
          variant="ghost"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-center gap-1 text-label text-green-700 py-2 h-auto"
        >
          {expanded ? 'Show fewer trucks' : `Show all ${TRUCK_TIERS.length} truck types`}
          <ChevronDown size={16} className={cn('transition-transform duration-fast', expanded && 'rotate-180')} />
        </Button>
      )}
    </div>
  );
}
