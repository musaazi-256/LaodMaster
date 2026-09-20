import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

export const COUNTRIES = [
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211', flag: '🇸🇸' },
  { code: 'CD', name: 'DR Congo', dialCode: '+243', flag: '🇨🇩' },
];

export default function PhoneField({
  label = 'Phone number',
  helperText,
  error,
  disabled = false,
  value,
  onChange,
  countryCode = 'UG',
  onCountryChange,
  className,
  id,
  ...props
}) {
  const inputId = id || 'phone';
  const displayValue = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCode);

  useEffect(() => {
    if (countryCode) {
      setSelectedCountryCode(countryCode);
    }
  }, [countryCode]);

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCountryCode) || COUNTRIES[0];

  const handleCountrySelect = (e) => {
    const code = e.target.value;
    setSelectedCountryCode(code);
    const country = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
    onCountryChange?.(country);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={inputId} className="text-label text-neutral-900 font-medium">
          {label}
        </Label>
      )}
      <div className="relative flex items-center">
        {/* Interactive Country Selector Dropdown Pill */}
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-neutral-100/90 rounded-l-input border-r border-neutral-200 hover:bg-neutral-200/80 transition-colors">
          <div className="relative flex items-center gap-1.5 pl-3 pr-2.5 text-body text-neutral-800 pointer-events-none select-none">
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="font-semibold text-body-sm text-neutral-900">{selectedCountry.dialCode}</span>
            <ChevronDown size={14} className="text-neutral-500 ml-0.5" />
          </div>
          <select
            value={selectedCountryCode}
            onChange={handleCountrySelect}
            disabled={disabled}
            aria-label="Select Country Code"
            className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-pointer text-neutral-900 bg-white"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dialCode})
              </option>
            ))}
          </select>
        </div>
        <Input
          id={inputId}
          type="tel"
          inputMode="numeric"
          maxLength={9}
          placeholder="7XX XXX XXX"
          disabled={disabled}
          value={displayValue}
          onChange={onChange}
          className={cn(
            'pl-28',
            error && 'border-red-500 focus-visible:ring-red-500'
          )}
          {...props}
        />
      </div>
      {(helperText || error) && (
        <span className={cn('text-small', error ? 'text-red-500' : 'text-neutral-500')}>
          {error || helperText}
        </span>
      )}
    </div>
  );
}
