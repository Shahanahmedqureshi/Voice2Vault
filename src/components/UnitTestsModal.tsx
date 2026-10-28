import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { runPureFunctionTests, UnitTestResult } from '../tools/unitTests';

interface UnitTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnitTestsModal: React.FC<UnitTestsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [testResults, setTestResults] = useState<UnitTestResult[]>(() => runPureFunctionTests());

  const handleReRun = () => {
    setTestResults(runPureFunctionTests());
  };

  const allPassed = testResults.every((t) => t.passed);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E4E0D6] rounded-[8px] max-w-xl w-full p-5 text-[#1F2328] flex flex-col gap-4 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold text-[#1F2328]">
              Function tests
            </h3>
            <span className={`text-[12px] px-2 py-0.5 rounded-[4px] border ${
              allPassed ? 'text-[#2F6B3F] bg-[#E7F1EA] border-[#E4E0D6]' : 'text-[#A7321F] bg-[#FAE8E4] border-[#E4E0D6]'
            }`}>
              {allPassed ? 'All 5 passing' : 'Failures detected'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#5B6168] hover:text-[#1F2328] transition-colors p-1"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Test List */}
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
          {testResults.map((t, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] text-[13px] flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1F2328]">{t.name}</span>
                {t.passed ? (
                  <span className="text-[12px] text-[#2F6B3F] font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[2]" /> Passed
                  </span>
                ) : (
                  <span className="text-[12px] text-[#A7321F] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Failed
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[#5B6168]">{t.message}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E4E0D6]">
          <button
            type="button"
            onClick={handleReRun}
            className="h-[36px] px-3 text-[13px] font-medium border border-[#E4E0D6] rounded-[6px] bg-white text-[#1F2328] hover:bg-[#FBFAF7] transition-colors cursor-pointer"
          >
            Run tests again
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-[36px] px-4 text-[13px] font-medium bg-[#234E7D] text-white hover:bg-[#1B4068] rounded-[6px] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
