import { NavLink } from 'react-router-dom';
import Logo from '../identity/Logo';
import { Sidebar, SidebarItem } from '../ui/sidebar';

export default function AdminSidebar({ groups = [] }) {
  return (
    <Sidebar className="py-4">
      <div className="flex items-center px-5 pb-6">
        <Logo size="h-7" />
      </div>
      <nav className="flex flex-1 flex-col gap-6 px-3">
        {groups.map((group, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {group.label && (
              <span className="px-2.5 pb-1 text-small font-medium uppercase tracking-wide text-neutral-500">
                {group.label}
              </span>
            )}
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to.split('/').filter(Boolean).length <= 1}
              >
                {({ isActive }) => (
                  <SidebarItem active={isActive}>
                    <Icon size={17} />
                    {label}
                  </SidebarItem>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </Sidebar>
  );
}
