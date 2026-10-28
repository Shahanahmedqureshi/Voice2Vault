import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { AppSettings } from '../types/entities';
import { db } from '../store/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
}) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<AppSettings>(() => db.getSettings());
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = () => {
    db.updateSettings(settings);
    setSavedFeedback(true);
    onSettingsUpdated();
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 800);
  };

  const handleResetSeeds = () => {
    if (confirm('Reset all customers, inventory, and vouchers back to fresh demo seed state?')) {
      db.resetToSeeds();
      setSettings(db.getSettings());
      onSettingsUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E4E0D6] rounded-[8px] max-w-lg w-full p-5 text-[#1F2328] flex flex-col gap-4 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
          <h3 className="text-[16px] font-semibold text-[#1F2328]">
            Settings and simulation
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#5B6168] hover:text-[#1F2328] transition-colors p-1"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="flex flex-col gap-3 text-[13px]">
          {/* UPI ID */}
          <div className="flex flex-col gap-1">
            <label className="text-[#5B6168] font-medium">Test UPI VPA handle</label>
            <input
              type="text"
              value={settings.upiId}
              onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
              placeholder="e.g. vyaparvault@upi"
              className="p-2 text-[14px] bg-white border border-[#E4E0D6] rounded-[6px] text-[#1F2328] focus:border-[#234E7D]"
            />
            <span className="text-[12px] text-[#8A8F96]">
              Standard NPCI handle encoded into payment QR codes.
            </span>
          </div>

          {/* Risk Exposure Threshold */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-[#5B6168] font-medium">
                Credit risk exposure threshold ({settings.riskExposureThresholdPercent}%)
              </label>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={settings.riskExposureThresholdPercent}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  riskExposureThresholdPercent: Number(e.target.value),
                })
              }
              className="accent-[#234E7D]"
            />
            <span className="text-[12px] text-[#8A8F96]">
              Pending balance above this ratio of the bill prompts for review.
            </span>
          </div>

          {/* Demo Controls */}
          <div className="p-3 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] flex flex-col gap-2 mt-1">
            <div className="text-[12px] font-medium text-[#1F2328]">
              Failure testing
            </div>

            <label className="flex items-center gap-2 text-[#5B6168] cursor-pointer text-[13px]">
              <input
                type="checkbox"
                checked={settings.injectToolFailure}
                onChange={(e) =>
                  setSettings({ ...settings, injectToolFailure: e.target.checked })
                }
                className="accent-[#234E7D]"
              />
              <span>Fail the next ledger write (tests retry and backoff)</span>
            </label>

            <label className="flex items-center gap-2 text-[#5B6168] cursor-pointer text-[13px]">
              <input
                type="checkbox"
                checked={settings.injectModelRateLimit}
                onChange={(e) =>
                  setSettings({ ...settings, injectModelRateLimit: e.target.checked })
                }
                className="accent-[#234E7D]"
              />
              <span>Simulate model rate limit (tests fallback plan)</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#E4E0D6] pt-3">
          <button
            type="button"
            onClick={handleResetSeeds}
            className="h-[36px] px-3 text-[13px] text-[#A7321F] hover:bg-[#FAE8E4] border border-[#E4E0D6] rounded-[6px] transition-colors cursor-pointer"
          >
            Reset demo data
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] px-3 text-[13px] text-[#5B6168] hover:text-[#1F2328] hover:bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="h-[36px] px-4 text-[13px] font-medium bg-[#234E7D] hover:bg-[#1B4068] text-white rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {savedFeedback && <Check className="w-3.5 h-3.5" />}
              <span>{savedFeedback ? 'Saved' : 'Save changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
