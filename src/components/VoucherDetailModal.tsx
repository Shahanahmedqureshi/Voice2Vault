import React, { useState } from 'react';
import { X, MessageCircle, Copy, Check, ChevronDown, ChevronUp, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Voucher } from '../types/entities';
import { ForensicVoucher } from './ForensicVoucher';
import { formatVoucherForWhatsApp, getCustomerPhoneDigits } from '../utils/whatsappFormatter';

interface VoucherDetailModalProps {
  voucher: Voucher | null;
  onClose: () => void;
  onUpdateVoucher: (updated: Voucher) => void;
}

export const VoucherDetailModal: React.FC<VoucherDetailModalProps> = ({
  voucher,
  onClose,
  onUpdateVoucher,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!voucher) return null;

  const whatsappMessage = formatVoucherForWhatsApp(voucher);
  const phoneDigits = getCustomerPhoneDigits(voucher);
  const whatsappUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(whatsappMessage).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E4E0D6] rounded-[8px] max-w-4xl w-full p-4 sm:p-5 text-[#1F2328] flex flex-col gap-4 shadow-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E4E0D6] pb-3 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[16px] font-semibold text-[#1F2328]">
              Voucher {voucher.voucherNumber}
            </h3>
            <span className="text-[13px] text-[#5B6168]">· {voucher.partyName}</span>
            {voucher.hasMathAnomaly && (
              <span className="text-[11px] font-mono text-[#A7321F] bg-[#FAE8E4] px-2 py-0.5 rounded-[4px] border border-[#A7321F]/20">
                Math Discrepancy Adjusted
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Direct WhatsApp Share button in top header */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[6px] bg-[#234E7D] hover:bg-[#1B4068] text-white text-[13px] font-medium transition-colors cursor-pointer"
              title="Open WhatsApp with customer parchi"
            >
              <MessageCircle className="w-3.5 h-3.5 stroke-[2]" />
              <span>Share to WhatsApp</span>
              <ExternalLink className="w-3 h-3 text-white/80 ml-0.5" />
            </a>

            <button
              onClick={onClose}
              aria-label="Close"
              className="text-[#5B6168] hover:text-[#1F2328] transition-colors p-1.5 rounded-[4px] hover:bg-[#FBFAF7]"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* WhatsApp Customer Sharing Banner */}
        <div className="bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] p-3 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2F6B3F] shrink-0"></span>
              <div>
                <span className="text-[13px] font-medium text-[#1F2328]">
                  WhatsApp Customer Parchi (Hindi / Hinglish)
                </span>
                <p className="text-[12px] text-[#5B6168]">
                  {phoneDigits
                    ? `Prepared for ${voucher.partyName} (+${phoneDigits.slice(0, 2)} ${phoneDigits.slice(2)})`
                    : `Pre-formatted with items, total bill, paid amount, and audited balance.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-[6px] border border-[#E4E0D6] bg-white text-[#1F2328] hover:bg-[#FBFAF7] text-[12px] font-medium transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2F6B3F] stroke-[2]" />
                    <span className="text-[#2F6B3F]">Copied text!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#5B6168] stroke-[1.5]" />
                    <span>Copy message</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1 h-[30px] px-2.5 rounded-[6px] border border-[#E4E0D6] bg-white text-[#5B6168] hover:text-[#1F2328] text-[12px] font-medium transition-colors cursor-pointer"
              >
                <span>{showPreview ? 'Hide preview' : 'Preview message'}</span>
                {showPreview ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Expandable Preview */}
          {showPreview && (
            <div className="mt-2 pt-2 border-t border-[#E4E0D6]/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#5B6168]">
                <span>Customer message preview</span>
                <span>{whatsappMessage.length} characters</span>
              </div>
              <pre className="p-3 bg-white border border-[#E4E0D6] rounded-[4px] text-[12px] text-[#1F2328] font-sans whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto">
                {whatsappMessage}
              </pre>
            </div>
          )}
        </div>

        {/* Forensic Voucher component */}
        <div className="bg-white">
          <ForensicVoucher
            voucher={voucher as any}
            onAppendToRegister={() => {}}
            onUpdateVoucher={(v: any) => onUpdateVoucher(v)}
            isAppended={true}
          />
        </div>
      </div>
    </div>
  );
};
