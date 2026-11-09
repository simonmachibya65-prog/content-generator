import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon ? (
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-6">
          <Icon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
      ) : null}

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actionLabel && (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const NoResults = ({ searchQuery, onClear }) => (
  <EmptyState
    title="No results found"
    description={searchQuery ? `No results match "${searchQuery}". Try different keywords.` : 'Try adjusting your filters or search criteria.'}
    actionLabel={searchQuery ? 'Clear search' : 'Reset filters'}
    onAction={onClear}
  />
);

export const ErrorState = ({ error, onRetry }) => (
  <EmptyState
    title="Something went wrong"
    description={error || 'We encountered an error loading this content. Please try again.'}
    actionLabel="Try again"
    onAction={onRetry}
  />
);
