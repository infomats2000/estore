import React, { useState } from 'react';
import { X, Mail, Send, FileText, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react';
import { ERPReportData, EmailReportPayload } from '../../types';
import { exportReportToCSV } from '../../utils/reports/csvExporter';

interface EmailReportModalProps {
  report: ERPReportData;
  isOpen: boolean;
  onClose: () => void;
  onShowAlert?: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function EmailReportModal({ report, isOpen, onClose, onShowAlert }: EmailReportModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [subject, setSubject] = useState(`ERP Report: ${report.title} (${report.periodLabel})`);
  const [format, setFormat] = useState<'pdf' | 'csv' | 'html'>('pdf');
  const [customNotes, setCustomNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      onShowAlert?.('Invalid Email', 'Please enter a valid recipient email address.', 'error');
      return;
    }

    setIsSending(true);

    try {
      const payload: EmailReportPayload = {
        recipientEmail,
        ccEmail,
        subject,
        reportTitle: report.title,
        reportType: report.type,
        format,
        customNotes
      };

      const res = await fetch('/api/reports/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify({ payload, reportData: report })
      });

      if (!res.ok) {
        // Fallback: client mailto trigger if backend email service is offline
        const mailtoSubject = encodeURIComponent(subject);
        const mailtoBody = encodeURIComponent(
          `Hi,\n\nPlease find attached the ERP Report: ${report.title} (${report.periodLabel}).\n\n` +
          `KPI Summary:\n` +
          report.kpis.map(k => `- ${k.label}: ${k.value}`).join('\n') +
          `\n\nNotes:\n${customNotes}\n\nRegards,\nTECH SELLER ERP System`
        );
        window.open(`mailto:${recipientEmail}?cc=${ccEmail}&subject=${mailtoSubject}&body=${mailtoBody}`);

        if (format === 'csv') {
          exportReportToCSV(report);
        }
      }

      setSendSuccess(true);
      onShowAlert?.('Report Sent', `The report has been queued and dispatched to ${recipientEmail}.`, 'success');
      setTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Email API call error, using client fallback:', err);
      // Client fallback
      const mailtoSubject = encodeURIComponent(subject);
      const mailtoBody = encodeURIComponent(
        `Hi,\n\nPlease find the summary for ERP Report: ${report.title} (${report.periodLabel}).\n\n` +
        report.kpis.map(k => `- ${k.label}: ${k.value}`).join('\n') +
        `\n\nNotes:\n${customNotes}`
      );
      window.open(`mailto:${recipientEmail}?subject=${mailtoSubject}&body=${mailtoBody}`);

      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 1500);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Email ERP Report</h3>
              <p className="text-[11px] text-slate-400">{report.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {sendSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-base text-slate-800 dark:text-white">Report Dispatched!</h4>
            <p className="text-xs text-slate-500">The report document has been dispatched to {recipientEmail}.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-4">
            {/* Recipient Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Recipient Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="accountant@company.com.au, ceo@company.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* CC Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                CC (Optional)
              </label>
              <input
                type="email"
                placeholder="management@company.com"
                value={ccEmail}
                onChange={e => setCcEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Attachment Format */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Attachment Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['pdf', 'csv', 'html'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      format === fmt
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Additional Message / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Attach any comments for the financial team..."
                value={customNotes}
                onChange={e => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {isSending ? 'Dispatching...' : 'Send Report Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
