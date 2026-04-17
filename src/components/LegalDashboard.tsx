import React from 'react';
import { LegalResponse } from '../types';
import { FileText, Shield, AlertTriangle, Download, Copy, Share2, X, Check, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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



  const generatePDF = async () => {
    try {
      const cleanText = (text: string): string => {
        if (!text) return '';
        return text
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\u200B/g, '')
          .replace(/\r\n/g, '\n')
          .trim();
      };

      const finalLocalLetter = cleanText(data.complaint_letter_local || data.complaint_letter);
      const finalEnglishLetter = cleanText(data.complaint_letter_english || data.complaint_letter);
      const today = new Date().toLocaleDateString('en-IN');
      
      // Try html2canvas first for proper language support
      try {
        const letterContainer = document.createElement('div');
        letterContainer.style.position = 'absolute';
        letterContainer.style.left = '-9999px';
        letterContainer.style.top = '0';
        letterContainer.style.width = '210mm';
        letterContainer.style.padding = '25mm';
        letterContainer.style.fontFamily = 'Arial, sans-serif';
        letterContainer.style.fontSize = '12px';
        letterContainer.style.lineHeight = '1.6';
        letterContainer.style.backgroundColor = 'white';
        
        letterContainer.innerHTML = `
          <div style="padding-bottom: 50px;">
            <div style="color: #3b82f6; font-weight: bold;">LANGUAGE: LOCAL LANGUAGE</div>
            <div>Date: ${today}</div>
            <br/>
            <div>To,<br/>The Labour Commissioner<br/>Regional Labour Office<br/>[District]<br/>[State]</div>
            <br/>
            <div style="font-weight: bold;">SUBJECT: COMPLAINT REGARDING LABOUR LAW VIOLATION</div>
            <br/>
            <div>Respected Sir/Madam,</div>
            <br/>
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${finalLocalLetter}</pre>
            <br/>
            <div>I hereby declare that all facts stated are true and correct.</div>
            <br/>
            <div>Thanking you,</div>
            <div>Yours faithfully,</div>
            <br/><br/>
            <div>_____________________________</div>
            <div>Signature / Thumb Impression</div>
          </div>
          <div style="page-break-before: always; padding-top: 25px;">
            <div style="color: #3b82f6; font-weight: bold;">LANGUAGE: ENGLISH</div>
            <div>Date: ${today}</div>
            <br/>
            <div>To,<br/>The Labour Commissioner<br/>Regional Labour Office<br/>[District]<br/>[State]</div>
            <br/>
            <div style="font-weight: bold;">SUBJECT: COMPLAINT REGARDING LABOUR LAW VIOLATION</div>
            <br/>
            <div>Respected Sir/Madam,</div>
            <br/>
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${finalEnglishLetter}</pre>
            <br/>
            <div>I hereby declare that all facts stated are true and correct.</div>
            <br/>
            <div>Thanking you,</div>
            <div>Yours faithfully,</div>
            <br/><br/>
            <div>_____________________________</div>
            <div>Signature / Thumb Impression</div>
          </div>
        `;

        document.body.appendChild(letterContainer);
        letterContainer.offsetHeight;
        
        const canvas = await html2canvas(letterContainer, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true
        });
        
        document.body.removeChild(letterContainer);
        
        const imgData = canvas.toDataURL('image/png', 0.9);
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        if (imgHeight > 297) {
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, -(imgHeight - 297), imgWidth, imgHeight);
        }
        
        doc.save(`JusticeLink_Complaint_${new Date().getTime()}.pdf`);
        return;
        
      } catch (canvasError) {
        console.warn("html2canvas failed, falling back to direct PDF generation:", canvasError);
        
        // Fallback: Direct jsPDF generation for reliability
        const doc = new jsPDF('p', 'mm', 'a4');
        const margin = 25;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Page 1: Local Language
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        
        doc.text(`Date: ${today}`, margin, 25);
        doc.text("To,", margin, 40);
        doc.text("The Labour Commissioner / Factories Inspector,", margin, 45);
        doc.text("Regional Labour Office,", margin, 50);
        doc.text("[District]", margin, 55);
        doc.text("[State]", margin, 60);
        
        doc.setFont("helvetica", "bold");
        doc.text("SUBJECT: COMPLAINT REGARDING LABOUR LAW VIOLATION", margin, 75);
        doc.setFont("helvetica", "normal");
        
        doc.text("Respected Sir/Madam,", margin, 90);
        
        const letterLines = doc.splitTextToSize(finalLocalLetter, pageWidth - (margin * 2));
        doc.text(letterLines, margin, 100, { baseline: 'top' });
        
        doc.text("I hereby declare that all facts stated are true and correct.", margin, 220);
        doc.text("Thanking you,", margin, 235);
        doc.text("Yours faithfully,", margin, 240);
        doc.text("_____________________________", margin, 260);
        doc.text("Signature / Thumb Impression", margin, 265);
        
        // Page 2: English
        doc.addPage();
        
        doc.text(`Date: ${today}`, margin, 25);
        doc.text("To,", margin, 40);
        doc.text("The Labour Commissioner / Factories Inspector,", margin, 45);
        doc.text("Regional Labour Office,", margin, 50);
        doc.text("[District]", margin, 55);
        doc.text("[State]", margin, 60);
        
        doc.setFont("helvetica", "bold");
        doc.text("SUBJECT: COMPLAINT REGARDING LABOUR LAW VIOLATION", margin, 75);
        doc.setFont("helvetica", "normal");
        
        doc.text("Respected Sir/Madam,", margin, 90);
        
        const englishLines = doc.splitTextToSize(finalEnglishLetter, pageWidth - (margin * 2));
        doc.text(englishLines, margin, 100, { baseline: 'top' });
        
        doc.text("I hereby declare that all facts stated are true and correct.", margin, 220);
        doc.text("Thanking you,", margin, 235);
        doc.text("Yours faithfully,", margin, 240);
        doc.text("_____________________________", margin, 260);
        doc.text("Signature / Thumb Impression", margin, 265);
        
        doc.save(`JusticeLink_Complaint_${new Date().getTime()}.pdf`);
      }
      
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      alert(`Error generating PDF: ${error.message || "Please try again later"}`);
    }
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

         {/* Complaint Letter - Local Language */}
         <section>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complaint Letter - Local Language</h3>
           </div>
            <div className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm font-mono text-sm text-slate-800 whitespace-pre-wrap leading-relaxed relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full rotate-45 transform translate-x-8 -translate-y-8" />
               <div className="font-bold mb-4">GOVERNMENT COMPLAINT FORMAT</div>
               <div className="text-xs text-slate-500 mb-4">Date: {new Date().toLocaleDateString('en-IN')}</div>
               <div className="mb-4">
To,
The Labour Commissioner / Factories Inspector,
Regional Labour Office,
[District]
[State]

Subject: Complaint regarding labour law violation

Respected Sir/Madam,</div>
               {data.complaint_letter_local || data.complaint_letter}
               <div className="mt-6 font-bold">Declaration:</div>
               <div className="text-xs mb-4">I hereby declare that all facts stated are true and correct.</div>
               <div className="mt-4">Yours faithfully,</div>
               <div className="mt-8">_________________________</div>
               <div className="text-xs">Signature / Thumb Impression</div>
               <div className="text-xs mt-1">Name: _________________</div>
               <div className="text-xs mt-1">Mobile: _________________</div>
               
               <div className="mt-6 border-t pt-4 text-xs">
                 <div className="font-bold mb-2">ENCLOSURES:</div>
                 1. ID Card / Appointment letter<br/>
                 2. Salary slips / Bank statements<br/>
                 3. Copy of complaint to employer<br/>
                 4. Supporting evidence
               </div>
            </div>
         </section>

         {/* Complaint Letter - English */}
         <section>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complaint Letter - English</h3>
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
            <div className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm font-mono text-sm text-slate-800 whitespace-pre-wrap leading-relaxed relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-legal-primary/5 rounded-bl-full rotate-45 transform translate-x-8 -translate-y-8" />
               <div className="font-bold mb-4">GOVERNMENT COMPLAINT FORMAT</div>
               <div className="text-xs text-slate-500 mb-4">Date: {new Date().toLocaleDateString('en-IN')}</div>
               <div className="mb-4">
To,
The Labour Commissioner / Factories Inspector,
Regional Labour Office,
[District]
[State]

Subject: Complaint regarding labour law violation

Respected Sir/Madam,</div>
               {data.complaint_letter_english || data.complaint_letter}
               <div className="mt-6 font-bold">Declaration:</div>
               <div className="text-xs mb-4">I hereby declare that all facts stated are true and correct.</div>
               <div className="mt-4">Yours faithfully,</div>
               <div className="mt-8">_________________________</div>
               <div className="text-xs">Signature / Thumb Impression</div>
               <div className="text-xs mt-1">Name: _________________</div>
               <div className="text-xs mt-1">Mobile: _________________</div>
               
               <div className="mt-6 border-t pt-4 text-xs">
                 <div className="font-bold mb-2">ENCLOSURES:</div>
                 1. ID Card / Appointment letter<br/>
                 2. Salary slips / Bank statements<br/>
                 3. Copy of complaint to employer<br/>
                 4. Supporting evidence
               </div>
            </div>
         </section>
      </div>

       <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
         <div className="flex gap-2">
           <button 
             onClick={async () => await generatePDF()}
             className="flex-1 bg-legal-primary text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-legal-secondary transition-all shadow-md"
           >
             <Download className="w-4 h-4" />
             DOWNLOAD FULL PDF (BOTH LANGUAGES)
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
