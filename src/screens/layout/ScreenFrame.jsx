import TopAppBar from '../../components/navigation/TopAppBar';

// Shared page scaffold for "stack" screens (pushed on top of the tab flow): a
// TopAppBar, a scrollable body, and an optional sticky footer for a primary CTA.
export default function ScreenFrame({ title, onBack, actions, hideTopBar = false, transparent = false, footer, contentClassName = '', children }) {
  const showHeader = !hideTopBar && Boolean(title || onBack || actions);

  if (transparent) {
    return (
      <div className="relative flex flex-col h-full min-h-0">
        {showHeader && (
          <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
            <TopAppBar title={title} onBack={onBack} actions={actions} transparent={true} className="pointer-events-auto" />
          </div>
        )}
        <div className={`flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-4 ${contentClassName}`}>{children}</div>
        {footer && <div className="border-t border-neutral-200 bg-white px-4 py-3 flex flex-col gap-2 relative z-20">{footer}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {showHeader && <TopAppBar title={title} onBack={onBack} actions={actions} transparent={false} />}
      <div className={`flex-1 overflow-y-auto no-scrollbar px-4 py-4 ${contentClassName}`}>{children}</div>
      {footer && <div className="border-t border-neutral-200 bg-white px-4 py-3 flex flex-col gap-2">{footer}</div>}
    </div>
  );
}
