import React from 'react';

export const CardSkeleton = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
      </div>
    ))}
  </>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden animate-pulse">
    {/* Header */}
    <div className="border-b border-slate-200 dark:border-slate-700 p-4">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="border-b border-slate-100 dark:border-slate-700/50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded flex-1"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const StatCardSkeleton = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
      </div>
    ))}
  </>
);

export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg animate-pulse">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
    <div className="flex items-end justify-between h-64 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div 
          key={i} 
          className="bg-slate-200 dark:bg-slate-700 rounded-t w-full"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        ></div>
      ))}
    </div>
  </div>
);

export const GridSkeleton = ({ items = 6, columns = 3 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden animate-pulse">
        <div className="h-48 bg-slate-200 dark:bg-slate-700"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      </div>
    ))}
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCardSkeleton count={3} />
    </div>
    <ChartSkeleton />
    <TableSkeleton />
  </div>
);
