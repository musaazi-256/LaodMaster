import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-body-sm text-neutral-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-neutral-900 transition-colors duration-fast">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-neutral-900 font-medium' : ''}>{item.label}</span>
            )}
            {!isLast && <ChevronRight size={14} />}
          </span>
        );
      })}
    </nav>
  );
}
