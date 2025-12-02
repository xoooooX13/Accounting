
import React from 'react';
import { Edit2, Trash2, Eye, Plus, Search, Filter, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortKey?: keyof T;
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  onSort?: (field: keyof T) => void;
  sortField?: keyof T;
  sortDirection?: 'asc' | 'desc';
}

export function GenericTable<T extends { id: string }>({ 
  data, columns, title, onAdd, onEdit, onDelete, loading,
  onSort, sortField, sortDirection
}: GenericTableProps<T>) {
  
  const showActions = Boolean(onEdit || onDelete);

  return (
    <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface/50">
        <h2 className="text-lg font-bold text-text-main tracking-tight">{title}</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="h-10 w-full rounded-xl bg-surface-highlight border border-transparent pl-10 pr-4 text-sm text-text-main focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          {onAdd && (
            <button 
              onClick={onAdd}
              className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add New</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-highlight border-b border-border">
            <tr>
              {columns.map((col, idx) => {
                const sortableKey = col.sortKey || (typeof col.accessor === 'string' ? col.accessor as keyof T : undefined);
                const isSorted = sortField && sortableKey === sortField;
                return (
                  <th 
                    key={idx} 
                    className={`px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider ${col.className || ''} ${onSort && sortableKey ? 'cursor-pointer hover:text-text-main' : ''}`}
                    onClick={() => onSort && sortableKey && onSort(sortableKey)}
                  >
                    <div className={`flex items-center gap-1 ${col.className?.includes('text-right') ? 'justify-end' : ''}`}>
                      {col.header}
                      {isSorted && (
                        <ArrowUpDown size={12} className={`transition-transform ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
                      )}
                    </div>
                  </th>
                );
              })}
              {showActions && (
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
               <tr><td colSpan={columns.length + (showActions ? 1 : 0)} className="px-6 py-16 text-center text-text-muted animate-pulse">Loading data...</td></tr>
            ) : data.length === 0 ? (
              <tr>
                 <td colSpan={columns.length + (showActions ? 1 : 0)} className="px-6 py-16 text-center flex flex-col items-center justify-center text-text-muted">
                    <div className="bg-surface-highlight p-4 rounded-full mb-3"><Search size={24} className="opacity-50" /></div>
                    No records found.
                 </td>
               </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="group hover:bg-surface-highlight transition-colors duration-200">
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-6 py-4 text-text-main ${col.className || ''}`}>
                      {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(item); }} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted bg-surface/50">
        <span>Showing 1 to {data.length} of {data.length} entries</span>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-highlight hover:text-text-main transition-colors">Previous</button>
          <button className="px-3 py-1.5 rounded-lg bg-primary text-white shadow-md shadow-primary/20">1</button>
          <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-highlight hover:text-text-main transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
