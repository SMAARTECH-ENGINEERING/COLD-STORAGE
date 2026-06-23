import React from 'react';

const TONE_CLASSES = {
  neutral: 'bg-gray-100 text-gray-600',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-info-100 text-info-700',
};

/** Small pill label. `tone` picks a semantic color from the design system. */
const Badge = ({ tone = 'neutral', children, className = '' }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${TONE_CLASSES[tone] || TONE_CLASSES.neutral} ${className}`}>
    {children}
  </span>
);

export default Badge;
