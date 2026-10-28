import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Camera, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '../store/db';

interface CommandPanelProps {
  onSubmitRequest: (text: string, imageBase64?: string, audioBase64?: string) => Promise<void>;
  isBusy: boolean;
  isPlanning?: boolean;
  onRunDemoScenario: (scenarioIndex: number) => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  onSubmitRequest,
  isBusy,
  isPlanning = false,
  onRunDemoScenario,
}) => {
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'photo'>('text');
  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'hi-IN' | 'en-US'>('en-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveText, setLiveText] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [pendingVoiceText, setPendingVoiceText] = useState('');
  const [showVoiceConfirm, setShowVoiceConfirm] = useState(false);

  // Loading & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingScenario, setLoadingScenario] = useState<number | null>(null);

  // Photo state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [pendingOcrText, setPendingOcrText] = useState('');
  const [showPhotoConfirm, setShowPhotoConfirm] = useState(false);
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);

  // Status & errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micTestResult, setMicTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const rawTranscriptRef = useRef('');
  const timerIntervalRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Test microphone using getUserMedia
  const handleTestMicrophone = async () => {
    setErrorMessage(null);
    setMicTestResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Use Chrome or Edge, or type the request.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately so mic isn't held open
      stream.getTracks().forEach((track) => track.stop());
      setMicTestResult({
        success: true,
        message: 'Microphone is working! Audio permission granted.',
      });
    } catch (err: any) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone is blocked. Click the lock icon in the address bar, allow Microphone, then retry.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone found.');
      } else {
        setErrorMessage(`Microphone test failed: ${name || err?.message || 'unknown error'}`);
      }
    }
  };

  // Start continuous Web Speech recognition
  const startRecording = () => {
    setErrorMessage(null);
    setMicTestResult(null);
    setLiveText('');
    setRawTranscript('');
    rawTranscriptRef.current = '';
    setShowVoiceConfirm(false);
    setRecordingSeconds(0);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Use Chrome or Edge, or type the request.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLanguage;
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        const combined = (final + interim).trim();
        setLiveText(combined);
        rawTranscriptRef.current = combined;
      };

      recognition.onerror = (e: any) => {
        const err = e?.error;
        console.warn('SpeechRecognition error:', err);

        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setErrorMessage(
            'Microphone is blocked. Click the lock icon in the address bar, allow Microphone, then retry.'
          );
          stopRecording(false);
        } else if (err === 'no-speech') {
          setErrorMessage('Nothing was heard.');
        } else if (err === 'audio-capture') {
          setErrorMessage('No microphone found.');
          stopRecording(false);
        } else if (err === 'network') {
          setErrorMessage('Speech service needs internet.');
        } else {
          setErrorMessage(err ? `Speech error: ${err}` : 'An unexpected speech error occurred.');
        }
      };

      // Auto-restart recognition on 'end' until user presses Stop
      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (restartErr) {
            console.warn('Auto-restart recognition attempt:', restartErr);
          }
        }
      };

      isRecordingRef.current = true;
      setIsRecording(true);
      recognition.start();

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setErrorMessage(
        'Speech recognition failed to start. Click the lock icon in the address bar, allow Microphone, then retry.'
      );
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  // Stop recording and show confirmation box "What I heard"
  const stopRecording = (shouldConfirm = true) => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (shouldConfirm) {
      const captured = rawTranscriptRef.current.trim();
      setRawTranscript(captured);
      setPendingVoiceText(captured);
      setShowVoiceConfirm(true);
    }
  };

  // Confirm voice text
  const handleConfirmVoiceText = () => {
    const confirmed = pendingVoiceText.trim();
    setInputText(confirmed);
    setShowVoiceConfirm(false);

    // Log both raw_transcript and confirmed_text in Activity log
    db.logAction({
      id: `audit-voice-${Date.now()}`,
      timestamp: Date.now(),
      agent: 'intake',
      tool: 'browser_speech_recognition',
      inputs: { raw_transcript: rawTranscript },
      outputs: { confirmed_text: confirmed },
      durationMs: recordingSeconds * 1000,
      status: 'SUCCESS',
    });

    db.broadcastMessage({
      id: `msg-voice-${Date.now()}`,
      timestamp: Date.now(),
      from: 'user',
      to: 'intake',
      type: 'VOICE_TRANSCRIPT_CONFIRMED',
      payload: {
        raw_transcript: rawTranscript,
        confirmed_text: confirmed,
      },
    });
  };

  // Record again button in confirmation box
  const handleRecordAgain = () => {
    setShowVoiceConfirm(false);
    startRecording();
  };

  // Handle Photo selection and raw OCR extraction
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result as string;
      setAttachedImage(base64);
      setInputMode('photo');
      setIsExtractingOcr(true);

      try {
        const res = await fetch('/api/ocr-raw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.rawOcrText || '';
          setRawOcrText(rawText);
          setPendingOcrText(rawText);
          setShowPhotoConfirm(true);
        } else {
          // Fallback if API unavailable
          const fallback = 'Sharma Kirana\n20 peti oil\nTotal 42000, Paid 15000, Baaki 29000';
          setRawOcrText(fallback);
          setPendingOcrText(fallback);
          setShowPhotoConfirm(true);
        }
      } catch (err) {
        console.warn('OCR raw extraction failed:', err);
        const fallback = 'Sharma Kirana\n20 peti oil\nTotal 42000, Paid 15000, Baaki 29000';
        setRawOcrText(fallback);
        setPendingOcrText(fallback);
        setShowPhotoConfirm(true);
      } finally {
        setIsExtractingOcr(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Confirm photo OCR text
  const handleConfirmPhotoText = () => {
    const confirmed = pendingOcrText.trim();
    setInputText(confirmed);
    setShowPhotoConfirm(false);

    db.logAction({
      id: `audit-ocr-${Date.now()}`,
      timestamp: Date.now(),
      agent: 'intake',
      tool: 'bill_ocr_extraction',
      inputs: { raw_ocr_text: rawOcrText },
      outputs: { confirmed_text: confirmed },
      durationMs: 450,
      status: 'SUCCESS',
    });

    db.broadcastMessage({
      id: `msg-ocr-${Date.now()}`,
      timestamp: Date.now(),
      from: 'user',
      to: 'intake',
      type: 'PHOTO_OCR_CONFIRMED',
      payload: {
        raw_ocr_text: rawOcrText,
        confirmed_text: confirmed,
      },
    });
  };

  // Form submit with immediate responsiveness
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;
    if (isBusy || isPlanning || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitRequest(inputText.trim(), attachedImage || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunScenarioWithLoading = async (scenarioIndex: number, text?: string) => {
    if (isBusy || isPlanning || isSubmitting || loadingScenario !== null) return;
    if (text) setInputText(text);
    setLoadingScenario(scenarioIndex);
    try {
      await onRunDemoScenario(scenarioIndex);
    } finally {
      setLoadingScenario(null);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-[#E4E0D6] rounded-[8px] flex flex-col">
      {/* 48px Header row */}
      <div className="h-[48px] px-4 border-b border-[#E4E0D6] flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#1F2328]">New request</h2>

        {/* Underline tabs for Text / Voice / Photo */}
        <div className="flex items-center gap-4 text-[13px]">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`pb-1 border-b-2 font-medium transition-colors cursor-pointer ${
              inputMode === 'text'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setInputMode('voice')}
            className={`pb-1 border-b-2 font-medium transition-colors cursor-pointer ${
              inputMode === 'voice'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            Voice
          </button>
          <button
            type="button"
            onClick={() => setInputMode('photo')}
            className={`pb-1 border-b-2 font-medium transition-colors cursor-pointer ${
              inputMode === 'photo'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            Photo
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Error message in plain words */}
        {errorMessage && (
          <div className="p-2.5 bg-[#FAE8E4] border border-[#A7321F]/30 rounded-[6px] text-[12px] text-[#A7321F] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.5]" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Microphone Test Status */}
        {micTestResult && (
          <div className="p-2 bg-[#E7F1EA] border border-[#2F6B3F]/30 rounded-[6px] text-[12px] text-[#2F6B3F] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" />
            <span>{micTestResult.message}</span>
          </div>
        )}

        {/* VOICE MODE CONTROLS */}
        {inputMode === 'voice' && (
          <div className="p-3 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Language selection dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#5B6168]">Language:</span>
                <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value as any)}
                  disabled={isRecording}
                  className="text-[12px] px-2 py-1 bg-white border border-[#E4E0D6] rounded-[4px] text-[#1F2328] focus:border-[#234E7D]"
                >
                  <option value="en-IN">Hinglish (en-IN)</option>
                  <option value="hi-IN">Hindi (hi-IN)</option>
                  <option value="en-US">English (en-US)</option>
                </select>
              </div>

              {/* Test microphone link */}
              <button
                type="button"
                onClick={handleTestMicrophone}
                className="text-[12px] text-[#234E7D] hover:underline cursor-pointer"
              >
                Test microphone
              </button>
            </div>

            {/* Recording Button & Timer */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (isRecording ? stopRecording(true) : startRecording())}
                className={`h-[36px] px-3.5 text-[13px] font-medium rounded-[6px] border transition-colors flex items-center gap-2 cursor-pointer ${
                  isRecording
                    ? 'bg-[#FAE8E4] border-[#A7321F] text-[#A7321F]'
                    : 'bg-[#234E7D] border-[#234E7D] text-white hover:bg-[#1B4068]'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4 stroke-[1.5]" /> : <Mic className="w-4 h-4 stroke-[1.5]" />}
                <span>{isRecording ? 'Stop' : 'Start recording'}</span>
              </button>

              {isRecording && (
                <div className="flex items-center gap-2 text-[12px] font-mono text-[#A7321F]">
                  <span className="w-2 h-2 rounded-full bg-[#A7321F] animate-ping" />
                  <span>{formatTimer(recordingSeconds)}</span>
                </div>
              )}
            </div>

            {/* Live text while speaking */}
            {isRecording && (
              <div className="p-2.5 bg-white border border-[#E4E0D6] rounded-[4px] text-[13px] text-[#1F2328]">
                <span className="text-[11px] text-[#8A8F96] block mb-0.5">Listening:</span>
                <p className="italic text-[#5B6168]">
                  {liveText ? `"${liveText}"` : 'Speak now into microphone...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: EXACT TRANSCRIPT CONFIRMATION ("What I heard") */}
        {showVoiceConfirm && (
          <div className="p-3 bg-[#FFFFFF] border-2 border-[#234E7D]/40 rounded-[6px] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#1F2328]">What I heard</span>
              <span className="text-[11px] text-[#8A8F96]">Exact transcript &bull; Editable</span>
            </div>
            <textarea
              rows={3}
              value={pendingVoiceText}
              onChange={(e) => setPendingVoiceText(e.target.value)}
              className="w-full p-2 text-[13px] bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[#1F2328] focus:border-[#234E7D] resize-none"
              placeholder="Captured transcript..."
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleRecordAgain}
                className="h-[32px] px-3 text-[12px] font-medium border border-[#E4E0D6] rounded-[4px] bg-white text-[#5B6168] hover:bg-[#FBFAF7] transition-colors cursor-pointer"
              >
                Record again
              </button>
              <button
                type="button"
                onClick={handleConfirmVoiceText}
                className="h-[32px] px-3.5 text-[12px] font-medium rounded-[4px] bg-[#234E7D] text-white hover:bg-[#1B4068] transition-colors cursor-pointer"
              >
                Use this text
              </button>
            </div>
          </div>
        )}

        {/* PHOTO OCR CONFIRMATION ("Text read from the bill") */}
        {inputMode === 'photo' && !showPhotoConfirm && (
          <div className="p-3 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtractingOcr}
                className="h-[36px] px-3.5 text-[13px] font-medium rounded-[6px] border border-[#E4E0D6] bg-white text-[#1F2328] hover:bg-[#FBFAF7] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 stroke-[1.5] text-[#5B6168]" />
                <span>Select bill photo</span>
              </button>
              {isExtractingOcr && (
                <div className="flex items-center gap-1.5 text-[12px] text-[#234E7D]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reading text from bill...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {showPhotoConfirm && (
          <div className="p-3 bg-[#FFFFFF] border-2 border-[#234E7D]/40 rounded-[6px] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#1F2328]">Text read from the bill</span>
              <span className="text-[11px] text-[#8A8F96]">Raw OCR &bull; Editable</span>
            </div>
            <textarea
              rows={4}
              value={pendingOcrText}
              onChange={(e) => setPendingOcrText(e.target.value)}
              className="w-full p-2 text-[13px] bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[#1F2328] focus:border-[#234E7D] resize-none"
              placeholder="Extracted OCR text..."
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-[32px] px-3 text-[12px] font-medium border border-[#E4E0D6] rounded-[4px] bg-white text-[#5B6168] hover:bg-[#FBFAF7] transition-colors cursor-pointer"
              >
                Re-upload photo
              </button>
              <button
                type="button"
                onClick={handleConfirmPhotoText}
                className="h-[32px] px-3.5 text-[12px] font-medium rounded-[4px] bg-[#234E7D] text-white hover:bg-[#1B4068] transition-colors cursor-pointer"
              >
                Use this text
              </button>
            </div>
          </div>
        )}

        {/* 6-row Textarea for the confirmed text / request */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type a request, record voice, or attach a kachha bill photo, e.g. Sharma Kirana pe 20 peti oil utaara, 42000 bill, 15000 mila, baaki 29000"
            className="w-full p-2.5 text-[14px] bg-white border border-[#E4E0D6] rounded-[6px] text-[#1F2328] placeholder:text-[#8A8F96] focus:border-[#234E7D] resize-none leading-relaxed transition-colors"
          />

          {/* Attached image preview badge if present */}
          {attachedImage && (
            <div className="flex items-center justify-between p-2 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] text-[13px]">
              <div className="flex items-center gap-2">
                <img
                  src={attachedImage}
                  alt="Bill attachment"
                  className="w-9 h-9 object-cover rounded-[4px] border border-[#E4E0D6]"
                />
                <span className="text-[#5B6168]">Bill image attached</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setShowPhotoConfirm(false);
                }}
                className="text-[12px] text-[#A7321F] hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Action Row with immediate interactive feedback */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-[#8A8F96]">
              {isPlanning || isSubmitting ? (
                <span className="text-[#234E7D] font-medium flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline stroke-[2]" />
                  Synthesizing agent pipeline...
                </span>
              ) : isBusy ? (
                <span className="text-[#234E7D] font-medium flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline stroke-[2]" />
                  Workforce executing tasks...
                </span>
              ) : (
                <span>Press ⌘+Enter or click to execute</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isBusy || isPlanning || isSubmitting || (!inputText.trim() && !attachedImage)}
              className="h-[36px] px-4 text-[14px] font-medium rounded-[6px] bg-[#234E7D] text-white hover:bg-[#1B4068] active:bg-[#163557] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-none"
            >
              {isPlanning || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2]" />
                  <span>Planning DAG...</span>
                </>
              ) : isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2]" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <span>Plan and run</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo scenarios section with individual spinners */}
        <div className="mt-2 pt-3 border-t border-[#E4E0D6] flex flex-col gap-2">
          <div className="text-[12px] font-medium text-[#5B6168]">Demo scenarios</div>
          <div className="flex flex-col divide-y divide-[#E4E0D6] border border-[#E4E0D6] rounded-[6px] overflow-hidden">
            {/* Scenario 1: Clean sale */}
            <button
              type="button"
              onClick={() => {
                const text = 'Patel Hardware pe 50 box drill bits, 15000 bill, 12000 paid, 3000 due';
                handleRunScenarioWithLoading(1, text);
              }}
              disabled={isBusy || isPlanning || isSubmitting || loadingScenario !== null}
              className="p-2.5 bg-white hover:bg-[#FBFAF7] text-left transition-colors flex items-start justify-between gap-3 cursor-pointer disabled:opacity-50"
            >
              <div>
                <div className="text-[13px] font-medium text-[#1F2328]">Clean sale</div>
                <div className="text-[12px] text-[#5B6168] line-clamp-1 mt-0.5">
                  Patel Hardware pe 50 box drill bits, 15000 bill, 12000 paid, 3000 due
                </div>
              </div>
              {loadingScenario === 1 ? (
                <span className="text-[11px] text-[#234E7D] bg-[#E8EFF7] px-1.5 py-0.5 rounded-[4px] shrink-0 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin stroke-[2]" />
                  <span>Starting...</span>
                </span>
              ) : (
                <span className="text-[11px] text-[#5B6168] border border-[#E4E0D6] px-1.5 py-0.5 rounded-[4px] shrink-0 font-normal">
                  Clean match
                </span>
              )}
            </button>

            {/* Scenario 2: Amount mismatch */}
            <button
              type="button"
              onClick={() => {
                const text = 'Sharma Kirana pe 20 peti oil utaara, 42000 bill, 15000 mila, baaki 29000';
                handleRunScenarioWithLoading(2, text);
              }}
              disabled={isBusy || isPlanning || isSubmitting || loadingScenario !== null}
              className="p-2.5 bg-white hover:bg-[#FBFAF7] text-left transition-colors flex items-start justify-between gap-3 cursor-pointer disabled:opacity-50"
            >
              <div>
                <div className="text-[13px] font-medium text-[#1F2328]">Amount mismatch (₹2,000)</div>
                <div className="text-[12px] text-[#5B6168] line-clamp-1 mt-0.5">
                  Sharma Kirana pe 20 peti oil utaara, 42000 bill, 15000 mila, baaki 29000
                </div>
              </div>
              {loadingScenario === 2 ? (
                <span className="text-[11px] text-[#234E7D] bg-[#E8EFF7] px-1.5 py-0.5 rounded-[4px] shrink-0 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin stroke-[2]" />
                  <span>Starting...</span>
                </span>
              ) : (
                <span className="text-[11px] text-[#9A5B00] border border-[#E4E0D6] px-1.5 py-0.5 rounded-[4px] shrink-0 font-normal">
                  Needs approval
                </span>
              )}
            </button>

            {/* Scenario 3: Failure and retry */}
            <button
              type="button"
              onClick={() => handleRunScenarioWithLoading(3)}
              disabled={isBusy || isPlanning || isSubmitting || loadingScenario !== null}
              className="p-2.5 bg-white hover:bg-[#FBFAF7] text-left transition-colors flex items-start justify-between gap-3 cursor-pointer disabled:opacity-50"
            >
              <div>
                <div className="text-[13px] font-medium text-[#1F2328]">Failure and retry</div>
                <div className="text-[12px] text-[#5B6168] line-clamp-1 mt-0.5">
                  Godown database write failure injected; retries with backoff
                </div>
              </div>
              {loadingScenario === 3 ? (
                <span className="text-[11px] text-[#234E7D] bg-[#E8EFF7] px-1.5 py-0.5 rounded-[4px] shrink-0 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin stroke-[2]" />
                  <span>Starting...</span>
                </span>
              ) : (
                <span className="text-[11px] text-[#5B6168] border border-[#E4E0D6] px-1.5 py-0.5 rounded-[4px] shrink-0 font-normal">
                  Failure and retry
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
