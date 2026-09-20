import { ArrowLeft } from 'lucide-react';
import IconButton from '../actions/IconButton';
import { AppBar, AppBarTitle } from '../ui/app-bar';

export default function TopAppBar({ title, onBack, actions, transparent = false, className }) {
  return (
    <AppBar variant={transparent ? 'transparent' : 'default'} className={className}>
      {onBack && <IconButton icon={ArrowLeft} label="Back" variant={transparent ? 'secondary' : 'ghost'} onClick={onBack} />}
      {title && <AppBarTitle>{title}</AppBarTitle>}
      {!title && <div className="flex-1" />}
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </AppBar>
  );
}
