import React, { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ERPReportData, ReportColumn } from '../../types';

interface ReportViewerTableProps {
  report: ERPReportData;
  searchQuery?: string;
}

export default function ReportViewerTable({ report, searchQuery }: ReportViewerTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  let rows = [...report.rows];

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    rows = rows.filter(r => 
      Object.values(r).some(val => String(val).toLowerCase().includes(q))
    );
  }

  if (sortKey) {
    rows.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      return sortDir === 'asc' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatCellValue = (val: any, col: ReportColumn) => {
    if (val === null || val === undefined) return '-';

    if (col.format === 'currency' && typeof val === 'number') {
      const isNegative = val < 0;
      const formatted = '$' + Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return <span className={isNegative ? 'text-rose-600 font-bold' : 'text-slate-800 dark:text-slate-200 font-medium'}>{isNegative ? `(${formatted})` : formatted}</span>;
    }

    if (col.format === 'percent' && typeof val === 'number') {
      return <span className="font-semibold">{val.toFixed(1)}%</span>;
    }

    if (col.format === 'badge') {
      let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      const strVal = String(val).toLowerCase();
      if (strVal.includes('collected') || strVal.includes('active') || strVal.includes('paid') || strVal.includes('ready') || strVal.includes('completed')) {
        badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      } else if (strVal.includes('overdue') || strVal.includes('out of stock') || strVal.includes('theft') || strVal.includes('damaged')) {
        badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      } else if (strVal.includes('low stock') || strVal.includes('pending') || strVal.includes('credit')) {
        badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      }

      return (
        <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md tracking-wider ${badgeClass}`}>
          {String(val)}
        </span>
      );
    }

    if (typeof val === 'number') {
      return val.toLocaleString();
    }

    return String(val);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-white font-mono uppercase tracking-wider text-[11px] select-none">
            <tr>
              {report.columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`p-3 cursor-pointer hover:bg-slate-800 transition-colors ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    <span>{col.label}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-sans">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={report.columns.length} className="p-8 text-center text-slate-400 italic">
                  No matching record items found for this report filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                  {report.columns.map(col => (
                    <td
                      key={col.key}
                      className={`p-3 ${
                        col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                      } text-slate-700 dark:text-slate-300`}
                    >
                      {formatCellValue(row[col.key], col)}
                    </td>
                  ))}
                </tr>
              ))
            )}

            {/* Summary Row */}
            {report.summaryRow && (
              <tr className="bg-slate-100 dark:bg-slate-900/60 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                {report.columns.map((col, idx) => {
                  const val = report.summaryRow?.[col.key];
                  return (
                    <td
                      key={col.key}
                      className={`p-3 font-mono ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      } text-slate-900 dark:text-white`}
                    >
                      {idx === 0 && !val ? (
                        <span className="font-sans font-black tracking-wider uppercase text-blue-600 dark:text-blue-400">TOTALS</span>
                      ) : (
                        formatCellValue(val, col)
                      )}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <strong>{rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(rows.length, currentPage * pageSize)}</strong> of <strong>{rows.length}</strong> entries
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
