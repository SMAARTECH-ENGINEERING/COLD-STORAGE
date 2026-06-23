import React from 'react';

/** Consistent "nothing here" placeholder for lists/tables across the app. */
const EmptyState = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center gap-2 animate-fade-in">
    {icon && <div className="text-gray-300 mb-1">{icon}</div>}
    <p className="text-sm font-medium text-ink">{title}</p>
    {description && <p className="text-xs text-gray-400 max-w-xs">{description}</p>}
  </div>
);

export default EmptyState;
