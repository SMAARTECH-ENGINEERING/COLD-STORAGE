import React from 'react';

/**
 * Base elevated container used across every panel/card in the app.
 * `interactive` adds hover/focus affordances for clickable cards;
 * pass `as="button"` semantics via onClick + interactive for accessible click targets.
 */
const Card = ({ children, className = '', interactive = false, onClick, ...rest }) => {
  const base = 'bg-white rounded-xl shadow-card';
  const interactiveCls = interactive
    ? 'cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 focus-visible:shadow-focus'
    : '';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${interactiveCls} text-left w-full ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${base} ${interactiveCls} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default Card;
