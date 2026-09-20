import logoAsset from '../../assets/logo.svg';
import { cx } from '../../lib/cx';

const SIZE_CLASSES = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-12',
};

export default function Logo({ size = 'md', showTagline = false, className, imgClassName }) {
  const hClass = SIZE_CLASSES[size] || size;

  return (
    <div className={cx('inline-flex flex-col items-start', className)}>
      <img
        src={logoAsset}
        alt="LoadMastr"
        className={cx('w-auto object-contain', hClass, imgClassName)}
      />
      {showTagline && (
        <span className="text-[10px] font-medium text-neutral-500 tracking-wide mt-0.5">
          Move More. Go Further.
        </span>
      )}
    </div>
  );
}
