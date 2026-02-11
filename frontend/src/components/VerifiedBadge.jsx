import { CheckCircle } from 'lucide-react';

export default function VerifiedBadge({ size = 16, className = '' }) {
  return (
    <CheckCircle
      size={size}
      className={`text-blue-500 fill-blue-500 ${className}`}
      title="Verified Account"
    />
  );
}
