import React from 'react';

/** Shimmering placeholder block — replaces the flat `animate-pulse` grey boxes. */
const Skeleton = ({ className = '' }) => (
  <div className={`skeleton-shimmer animate-shimmer rounded ${className}`} />
);

export default Skeleton;
