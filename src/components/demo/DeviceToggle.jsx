import { Smartphone, Monitor } from 'lucide-react';
import { cx } from '../../lib/cx';

export default function DeviceToggle({
  platform,
  onSelectPlatform,
  viewMode,
  onToggleViewMode,
  showLabel = true,
  className,
}) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      {showLabel && (
        <span className="text-small font-medium text-neutral-500 whitespace-nowrap">
          Device Frame:
        </span>
      )}
      <div className="inline-flex items-center gap-1 p-1 bg-neutral-200/80 rounded-full border border-neutral-300/80 shadow-inner">
        <button
          type="button"
          onClick={() => onSelectPlatform('ios')}
          className={cx(
            'flex items-center gap-1.5 px-3.5 py-1.5 text-small font-medium rounded-full transition-all duration-fast select-none',
            platform === 'ios'
              ? 'bg-neutral-900 text-white shadow-1 font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/50'
          )}
        >
          <span></span>
          <span>iOS</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPlatform('android')}
          className={cx(
            'flex items-center gap-1.5 px-3.5 py-1.5 text-small font-medium rounded-full transition-all duration-fast select-none',
            platform === 'android'
              ? 'bg-neutral-900 text-white shadow-1 font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/50'
          )}
        >
          <span>🤖</span>
          <span>Android</span>
        </button>

        {onToggleViewMode && (
          <button
            type="button"
            onClick={onToggleViewMode}
            title={viewMode === 'framed' ? 'Switch to Full Screen Mobile view' : 'Switch to Phone Mockup frame view'}
            className={cx(
              'flex items-center gap-1 px-2.5 py-1 text-small font-medium rounded-full transition-all duration-fast border-l border-neutral-300 ml-1',
              viewMode === 'full'
                ? 'bg-green-500 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/50'
            )}
          >
            {viewMode === 'full' ? <Smartphone size={13} /> : <Monitor size={13} />}
            <span>{viewMode === 'full' ? 'Native View' : 'Frame View'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
