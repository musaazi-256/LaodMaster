import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export default function BottomNav({ items = [] }) {
  return (
    <nav className="flex items-stretch justify-between border-t border-neutral-200 bg-white pb-safe w-full">
      {items.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to.split('/').filter(Boolean).length <= 1}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors duration-fast relative min-w-0 px-1',
              isActive ? 'text-green-700 font-semibold' : 'text-neutral-500 hover:text-neutral-700'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative flex items-center justify-center">
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                {badge ? (
                  <Badge variant="destructive" className="absolute -top-1.5 -right-3 h-4 min-w-4 px-1 p-0 text-[9px] font-bold leading-none flex items-center justify-center rounded-full">
                    {badge}
                  </Badge>
                ) : null}
              </div>
              <span className={cn('truncate max-w-full', isActive ? 'font-semibold text-green-700' : 'font-medium')}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
