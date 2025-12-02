
import React from 'react';

interface LogoProps {
  variant?: 'default' | 'white' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'default', className = '' }) => {
  const isWhite = variant === 'white';
  
  const textColor = isWhite ? '#FFFFFF' : '#E0621B';
  const subTextColor = isWhite ? '#9CA3AF' : '#1A1A1A';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Text Only - Logo Icon Removed */}
      <div className="flex flex-col">
        <span className="text-3xl font-bold tracking-tighter font-display leading-none" style={{ color: textColor }}>
          MASUMA
        </span>
        <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase leading-none mt-1" style={{ color: subTextColor }}>
          Autoparts E.A.
        </span>
      </div>
    </div>
  );
};
