import React from 'react';
import { ShieldCheck, AlertCircle, ShieldAlert } from 'lucide-react';

interface VerificationBadgeProps {
  status: 'supported' | 'partially_supported' | 'unsupported' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED';
  claimStatus?: string;
  confidence?: number;
  showConfidence?: boolean;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  claimStatus,
  confidence,
  showConfidence = true,
  className = '',
}) => {
  const normStatus = status.toLowerCase();

  let bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let icon = <ShieldCheck className="w-4 h-4 text-emerald-600" />;
  let label = 'VERIFIED SUPPORTED';

  if (normStatus === 'partially_supported') {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <AlertCircle className="w-4 h-4 text-amber-600" />;
    label = 'PARTIALLY SUPPORTED';
  } else if (normStatus === 'unsupported') {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    icon = <ShieldAlert className="w-4 h-4 text-rose-600" />;
    label = 'UNSUPPORTED CLAIM';
  }

  const confidencePct = confidence !== undefined
    ? Math.round(confidence > 1 ? confidence : confidence * 100)
    : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs transition-all ${bgClass} ${className}`}
      title={claimStatus ? `Claim classification: ${claimStatus}` : undefined}
    >
      {icon}
      <span>{label}</span>
      {claimStatus && (
        <span className="opacity-75 font-normal">({claimStatus})</span>
      )}
      {showConfidence && confidencePct !== null && (
        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/70 font-mono text-[11px]">
          {confidencePct}%
        </span>
      )}
    </span>
  );
};
