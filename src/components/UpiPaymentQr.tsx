import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Smartphone
} from 'lucide-react';
import { Voucher } from '../types/voucher';

interface UpiPaymentQrProps {
  voucher: Voucher;
  onMarkPaid?: (updatedVoucher: Voucher) => void;
}

export const UpiPaymentQr: React.FC<UpiPaymentQrProps> = ({
  voucher,
  onMarkPaid,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isMarkingPaid, setIsMarkingPaid] = useState<boolean>(false);

  const netUdhaar = voucher.computedUdhaar || 0;
  const payeeVpa = 'vyaparvault@upi';
  const payeeName = 'VyaparVault Wholesale';

  // Format INR currency
  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Standard NPCI UPI URI Scheme
  const upiUri = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${netUdhaar.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Voucher ${voucher.voucherNumber} Settlement - ${voucher.partyName}`
  )}`;

  // Generate QR code whenever the net amount or voucher changes
  useEffect(() => {
    if (netUdhaar <= 0) {
      setQrDataUrl('');
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(upiUri, {
      width: 220,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate UPI QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiUri, netUdhaar]);

  const handleCopyVpa = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(payeeVpa).catch(() => {});
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleMarkAsPaid = () => {
    if (!onMarkPaid || netUdhaar <= 0) return;
    setIsMarkingPaid(true);

    setTimeout(() => {
      const updated: Voucher = {
        ...voucher,
        paidAmount: voucher.totalAmount,
        computedUdhaar: 0,
        statedUdhaar: 0,
        hasMathAnomaly: false,
        mathDiscrepancy: 0,
        paymentMode: 'UPI',
        creditRisk: {
          ...voucher.creditRisk,
          exposurePercent: 0,
          riskRating: 'LOW',
          badgeText: 'SETTLED VIA INSTANT UPI',
          cfoDirective: 'Account fully cleared via UPI QR scan.',
        },
        anomalyDetails: {
          ...voucher.anomalyDetails,
          actualBalance: 0,
          statedBalance: 0,
          discrepancyCaught: 0,
          explanation: 'Account balance cleared in full via Instant UPI QR scan.',
          riskClassification: 'CLEAN_SETTLEMENT',
        },
      };

      onMarkPaid(updated);
      setIsMarkingPaid(false);
    }, 400);
  };

  // If Net Udhaar is already 0, show a settled confirmation badge
  if (netUdhaar <= 0) {
    return (
      <div className="bg-[#E7F1EA] border border-[#2F6B3F]/30 rounded-[6px] p-3 flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-2 text-[#2F6B3F] font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#2F6B3F] shrink-0 stroke-[1.5]" />
          <span>Net udhaar settled: ₹0.00 outstanding on this voucher.</span>
        </div>
        <span className="font-mono font-medium text-[#2F6B3F] bg-white px-2 py-0.5 rounded-[4px] border border-[#2F6B3F]/30 text-[11px]">
          Fully paid
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] p-3.5 flex flex-col gap-3">
      {/* Header Bar with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[4px] bg-[#234E7D] text-white flex items-center justify-center">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#1F2328] flex items-center gap-1.5">
              <span>Pre-filled UPI QR</span>
              <span className="text-[11px] text-[#2F6B3F] bg-[#E7F1EA] px-1.5 py-0.5 rounded-[4px] font-medium">
                Scan to settle
              </span>
            </div>
            <div className="text-[12px] text-[#5B6168]">
              Payable: <span className="font-semibold text-[#1F2328] tabular-nums font-mono">{formatINR(netUdhaar)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[12px] text-[#5B6168] hover:text-[#1F2328] p-1 rounded-[4px] hover:bg-[#E4E0D6]/40 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>{isExpanded ? 'Hide QR' : 'Show QR'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded QR Display & Payment Card */}
      {isExpanded && (
        <div className="pt-2 border-t border-[#E4E0D6] flex flex-col sm:flex-row items-center gap-4 bg-white rounded-[6px] p-4 border border-[#E4E0D6]">
          {/* Real Scannable QR Code Canvas */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="p-2 bg-white rounded-[6px] border border-[#E4E0D6]">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI QR code for ${formatINR(netUdhaar)}`}
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-[#FBFAF7] text-[#8A8F96] text-[12px]">
                  Generating QR...
                </div>
              )}
            </div>
            <span className="text-[11px] text-[#8A8F96] mt-1 font-mono">
              BHIM UPI · NPCI Standard
            </span>
          </div>

          {/* Right Details & Quick Actions */}
          <div className="flex-1 flex flex-col gap-2.5 text-[13px] w-full">
            <div>
              <span className="text-[12px] text-[#5B6168]">
                Amount to pay (net udhaar)
              </span>
              <div className="text-[20px] font-semibold font-mono text-[#2F6B3F] tabular-nums">
                {formatINR(netUdhaar)}
              </div>
            </div>

            {/* VPA / Payee Info */}
            <div className="flex flex-col gap-1 bg-[#FBFAF7] p-2.5 rounded-[6px] border border-[#E4E0D6] font-mono text-[11px]">
              <div className="flex items-center justify-between text-[#5B6168]">
                <span>UPI VPA:</span>
                <button
                  type="button"
                  onClick={handleCopyVpa}
                  className="flex items-center gap-1 text-[#1F2328] hover:text-[#234E7D] cursor-pointer font-medium"
                  title="Copy UPI ID"
                >
                  <span>{payeeVpa}</span>
                  {isCopied ? (
                    <Check className="w-3 h-3 text-[#2F6B3F]" />
                  ) : (
                    <Copy className="w-3 h-3 text-[#8A8F96]" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between text-[#5B6168]">
                <span>Payee:</span>
                <span className="text-[#1F2328] font-sans font-medium">{payeeName}</span>
              </div>
            </div>

            {/* Supported Payment Apps */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#5B6168]">
              <span>Accepted apps:</span>
              <span className="px-1.5 py-0.5 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[#1F2328]">GPay</span>
              <span className="px-1.5 py-0.5 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[#1F2328]">PhonePe</span>
              <span className="px-1.5 py-0.5 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[#1F2328]">Paytm</span>
              <span className="px-1.5 py-0.5 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[#1F2328]">BHIM</span>
              <span className="px-1.5 py-0.5 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[#1F2328]">CRED</span>
            </div>

            {/* Actions: Open Native UPI Intent + Mark Paid Button */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Direct UPI deep link on mobile */}
              <a
                href={upiUri}
                className="flex-1 min-w-[120px] h-[36px] px-3 rounded-[6px] border border-[#E4E0D6] bg-white hover:bg-[#FBFAF7] text-[#1F2328] font-medium text-[13px] text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Open installed UPI app"
              >
                <Smartphone className="w-4 h-4 stroke-[1.5] text-[#5B6168]" />
                <span>Open in UPI app</span>
              </a>

              {/* Instant Clearance Trigger */}
              {onMarkPaid && (
                <button
                  type="button"
                  onClick={handleMarkAsPaid}
                  disabled={isMarkingPaid}
                  className="flex-1 min-w-[140px] h-[36px] px-3 rounded-[6px] bg-[#234E7D] hover:bg-[#1B4068] text-white font-medium text-[13px] text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Mark balance as received and update voucher"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
                  <span>{isMarkingPaid ? 'Clearing...' : 'Mark as paid via UPI'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
