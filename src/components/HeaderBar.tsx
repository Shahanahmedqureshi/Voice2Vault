import React, { useState } from 'react';
import { Search, Settings, Play, Loader2 } from 'lucide-react';

interface HeaderBarProps {
  onOpenSettings: () => void;
  onOpenDeveloperTrace: () => void;
  onStartJudgeMode: () => void;
  isJudgeModeActive: boolean;
  judgeStep: number;
  onGlobalCommand: (query: string) => void;
  isExecuting?: boolean;
  activeView?: 'landing' | 'workspace';
  onToggleView?: (view: 'landing' | 'workspace') => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenSettings,
  onOpenDeveloperTrace,
  onStartJudgeMode,
  isJudgeModeActive,
  judgeStep,
  onGlobalCommand,
  isExecuting,
  activeView = 'workspace',
  onToggleView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isExecuting) return;
    onGlobalCommand(searchQuery.trim());
    setSearchQuery('');
  };

  return (
    <header className="bg-white border-b border-[#E4E0D6] px-6 py-2.5 min-h-[56px] flex items-center justify-between gap-4">
      <div className="max-w-[1440px] w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Monogram + Wordmark + Description + Model */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          {/* Ink-blue monogram "V" */}
          <div className="w-8 h-8 rounded-[6px] bg-[#234E7D] text-white flex items-center justify-center font-semibold text-sm select-none shrink-0">
            V
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-semibold text-[#1F2328] leading-tight">
                Voice2Vault
              </span>
              <span className="text-[12px] text-[#5B6168]">
                Voice-first back office for field sales
              </span>
            </div>
            <div className="text-[12px] text-[#8A8F96] flex items-center gap-1.5 leading-tight mt-0.5">
              <span className="font-mono text-[11px] text-[#5B6168]">gemma-4-26b-a4b-it</span>
              <span>·</span>
              <span>Open-weight model, self-hostable. This build calls it via API.</span>
            </div>
          </div>
        </div>

        {/* Center: Request input (max-width 640px) */}
        <div className="flex-1 max-w-[640px] w-full">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8A8F96] absolute left-3 pointer-events-none stroke-[1.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a request, e.g. Sharma Kirana pe 20 peti oil utaara..."
              className="w-full pl-9 pr-9 py-1.5 text-[14px] bg-white border border-[#E4E0D6] rounded-[6px] text-[#1F2328] placeholder:text-[#8A8F96] focus:border-[#234E7D] focus:ring-1 focus:ring-[#E8EFF7] transition-all"
            />
            {isExecuting && (
              <Loader2 className="w-4 h-4 text-[#234E7D] animate-spin absolute right-3 pointer-events-none stroke-[2]" />
            )}
          </form>
        </div>

        {/* Right: View Toggle, Secondary "Run demo", Ghost "Activity", Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Toggle Segmented Control */}
          {onToggleView && (
            <div className="flex items-center bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] p-0.5 text-[13px] mr-1">
              <button
                type="button"
                onClick={() => onToggleView('landing')}
                className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                  activeView === 'landing'
                    ? 'bg-white text-[#234E7D] shadow-xs'
                    : 'text-[#5B6168] hover:text-[#1F2328]'
                }`}
              >
                3D Problem
              </button>
              <button
                type="button"
                onClick={() => onToggleView('workspace')}
                className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                  activeView === 'workspace'
                    ? 'bg-white text-[#234E7D] shadow-xs'
                    : 'text-[#5B6168] hover:text-[#1F2328]'
                }`}
              >
                Workspace
              </button>
            </div>
          )}

          {/* Secondary button "Run demo" */}
          <button
            type="button"
            onClick={onStartJudgeMode}
            disabled={isJudgeModeActive}
            className={`h-[36px] px-3.5 text-[14px] font-medium rounded-[6px] border border-[#E4E0D6] bg-white text-[#1F2328] hover:bg-[#FBFAF7] hover:border-[#CFC9BC] active:bg-[#F6F4EF] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Play className="w-3.5 h-3.5 text-[#5B6168] fill-[#5B6168]" />
            <span>{isJudgeModeActive ? `Running demo (${judgeStep}/3)` : 'Run demo'}</span>
          </button>

          {/* Ghost button "Activity" */}
          <button
            type="button"
            onClick={onOpenDeveloperTrace}
            className="h-[36px] px-3 text-[14px] font-medium text-[#5B6168] hover:text-[#1F2328] hover:bg-[#FBFAF7] rounded-[6px] transition-colors cursor-pointer"
          >
            Activity
          </button>

          {/* Settings icon button */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="h-[36px] w-[36px] flex items-center justify-center text-[#5B6168] hover:text-[#1F2328] hover:bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};
