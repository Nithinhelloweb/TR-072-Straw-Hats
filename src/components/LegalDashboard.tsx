import React from 'react';
import { LegalResponse } from '../types';
import { FileText, Shield, AlertTriangle, Download, Copy, Share2, X, Check, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

interface LegalDashboardProps {
  data: LegalResponse | null;
  onClose?: () => void;
}

export const LegalDashboard: React.FC<LegalDashboardProps> = ({ data, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!data) {
    return (
      <div className="w-full lg:w-96 h-full border-l border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-8 text-center relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-200 rounded-lg text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <Shield className="w-12 h-12 text-slate-200 mb-4" />
        <h3 className="text-slate-400 font-medium">Case Details</h3>
        <p className="text-slate-400 text-xs mt-2">
          Start a conversation to analyze legal violations and generate a complaint letter.
        </p>
      </div>
    );
  }

  const categoryMap: Record<string, string> = {
    wage_theft: 'Wage Theft',
    unsafe_conditions: 'Unsafe Working Conditions',
    harassment: 'Harassment',
    forced_labor: 'Forced Labor',
    child_labor: 'Child Labor',
    discrimination: 'Discrimination',
    other: 'Legal Violation',
  };

  // Split content into Local and English if separator exists
  const splitContent = (text: string) => {
    if (text.includes('---')) {
      const parts = text.split('---');
      return { local: parts[0].trim(), english: parts[1].trim() };
    }
    // Fallback split for common newline patterns
    const newlineParts = text.split('\n\n');
    if (newlineParts.length >= 2) {
      return { local: newlineParts[0].trim(), english: newlineParts.slice(1).join('\n\n').trim() };
    }
    return { local: text, english: text };
  };

  const summary = splitContent(data.legal_summary);
  const letter = splitContent(data.complaint_letter);

  const generatePDF = (lang: 'local' | 'english') => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });
    
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Clean and sanitize text - remove unicode control characters and fix encoding
    const cleanText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control chars
        .replace(/\u200B/g, '') // Remove zero-width spaces
        .replace(/\r\n/g, '\n')
        .trim();
    };

    const contentSummary = cleanText(lang === 'local' ? summary.local : summary.english);
    const contentLetter = cleanText(lang === 'local' ? letter.local : letter.english);
    const title = lang === 'local' ? "Legal Report (Local Language)" : "Legal Report (English)";

    // Use standard font that supports UTF-8 properly
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(51, 65, 85); 
    doc.text("JusticeLink", margin, currentY);
    doc.setFontSize(12);
    doc.text(title, margin, currentY + 7);
    currentY += 20;

    // Case Category
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11);
    doc.text(`Category: ${categoryMap[data.category] || data.category}`, margin, currentY);
    currentY += 15;

    // Legal Summary
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text("Summary:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    currentY += 7;
    
    // Use native text encoding for proper UTF-8 support
    const summaryLines = doc.splitTextToSize(contentSummary, pageWidth - (margin * 2));
    doc.text(summaryLines, margin, currentY, {
      baseline: 'top',
      encoding: 'Unicode'
    });
    currentY += (summaryLines.length * 6) + 12;

    // Laws
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Relevant Laws:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    currentY += 7;
    data.laws.forEach((law) => {
      doc.text(`• ${cleanText(law)}`, margin + 5, currentY, { encoding: 'Unicode' });
      currentY += 7;
    });
    currentY += 12;

    // Complaint Letter
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Formal Complaint:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    currentY += 7;
    const letterLines = doc.splitTextToSize(contentLetter, pageWidth - (margin * 2));
    
    // Check if letter fits on page
    if (currentY + (letterLines.length * 5) > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.text(letterLines, margin, currentY, {
      baseline: 'top',
      encoding: 'Unicode'
    });

    // Disclaimer
    currentY += (letterLines.length * 5) + 15;
    if (currentY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by JusticeLink AI. This is a preliminary report for informational purposes.", margin, currentY, {
      encoding: 'Unicode'
    });

    doc.save(`JusticeLink_${lang}_Report_${new Date().getTime()}.pdf`);
  };

  const shareViaEmail = () => {
    const subject = `JusticeLink Legal Report: ${categoryMap[data.category] || data.category}`;
    const body = `Legal Summary:\n${data.legal_summary}\n\nRelevant Laws:\n${data.laws.join('\n')}\n\nComplaint Letter:\n${data.complaint_letter}`;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.complaint_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full lg:border-l border-slate-200 bg-white flex flex-col overflow-hidden shadow-2xl lg:shadow-none">
      <div className="p-6 border-bottom border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-legal-primary" />
          <h2 className="text-lg font-bold text-legal-secondary">Case Info</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {categoryMap[data.category] || data.category}
          </span>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Legal Summary */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Legal Summary</h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-sm text-slate-700 leading-relaxed font-hindi-support whitespace-pre-wrap">
              {data.legal_summary}
            </div>
          </div>
        </section>

        {/* Laws Involved */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Relevant Laws</h3>
          <div className="flex flex-wrap gap-2">
            {data.laws.map((law, index) => (
              <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100">
                {law}
              </span>
            ))}
          </div>
        </section>

        {/* Complaint Letter */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complaint Letter</h3>
            <div className="flex gap-2">
              <button 
                onClick={copyToClipboard}
                className={`p-1.5 rounded transition-colors ${copied ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                title={copied ? "Copied!" : "Copy"}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm font-serif text-sm text-slate-800 whitespace-pre-wrap leading-relaxed relative overflow-hidden font-hindi-support">
             <div className="absolute top-0 right-0 w-16 h-16 bg-legal-primary/5 rounded-bl-full rotate-45 transform translate-x-8 -translate-y-8" />
             {data.complaint_letter}
          </div>
        </section>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
        <div className="flex gap-2">
          <button 
            onClick={() => generatePDF('local')}
            className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            LOCAL PDF
          </button>
          <button 
            onClick={() => generatePDF('english')}
            className="flex-1 bg-legal-primary text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-legal-secondary transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            ENGLISH PDF
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={shareViaEmail}
            className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all"
          >
            <Mail className="w-4 h-4" />
            SHARE VIA EMAIL
          </button>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
