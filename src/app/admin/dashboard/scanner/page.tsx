'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Camera, Search, CheckCircle, XCircle, AlertCircle, Loader2, StopCircle } from 'lucide-react';

type ScanResult = 'success' | 'already_entered' | 'invalid' | 'unpaid' | null;

interface ScanResponse {
  result: ScanResult | 'invalid';
  message: string;
  studentName?: string;
  department?: string;
  collegeId?: string;
  registrationId?: string;
  enteredAt?: string;
}

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [manualId, setManualId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<{ stop: () => void } | null>(null);

  const processToken = useCallback(async (token: string) => {
    if (loading) return;
    setLoading(true);
    setScanResult(null);
    
    try {
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult({ result: 'invalid', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const processRegistrationId = useCallback(async (registrationId: string) => {
    if (!registrationId.trim()) return;
    setLoading(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: registrationId.trim().toUpperCase() }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult({ result: 'invalid', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setScanResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);

      // Dynamically import html5-qrcode
      const { Html5Qrcode } = await import('html5-qrcode');
      const qrScanner = new Html5Qrcode('qr-reader');
      scannerRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          processToken(decodedText);
        },
        undefined
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera not accessible';
      if (message.includes('Permission') || message.includes('denied')) {
        setCameraError('Camera permission denied. Please allow camera access and try again.');
      } else {
        setCameraError('Could not access camera: ' + message);
      }
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await (scannerRef.current as unknown as { stop: () => Promise<void> }).stop();
      } catch { /* ignore */ }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const getResultColors = (result: string) => {
    switch (result) {
      case 'success': return { bg: 'bg-green-900/30 border-green-700/40', icon: CheckCircle, iconColor: 'text-green-400', title: '✓ VALID TICKET – ENTRY GRANTED' };
      case 'already_entered': return { bg: 'bg-yellow-900/30 border-yellow-700/40', icon: AlertCircle, iconColor: 'text-yellow-400', title: '⚠ ALREADY ENTERED' };
      case 'unpaid': return { bg: 'bg-red-900/30 border-red-700/40', icon: XCircle, iconColor: 'text-red-400', title: '✗ UNPAID REGISTRATION' };
      case 'invalid': return { bg: 'bg-red-900/30 border-red-700/40', icon: XCircle, iconColor: 'text-red-400', title: '✗ INVALID TICKET' };
      default: return { bg: 'bg-slate-900/30 border-slate-700/40', icon: QrCode, iconColor: 'text-slate-400', title: 'Unknown' };
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">QR Entry Scanner</h1>
        <p className="text-slate-400 text-sm">Scan student QR codes to verify and grant entry.</p>
      </div>

      {/* Camera scanner */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Camera className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Camera Scanner</h3>
        </div>

        <div id="qr-reader" className={scanning ? 'rounded-xl overflow-hidden mb-4' : 'hidden'} style={{ width: '100%' }} />

        {cameraError && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-4">
            <p className="text-red-300 text-sm">{cameraError}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!scanning ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl btn-glow transition-all"
            >
              <Camera className="w-5 h-5" />
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-700/30 text-red-400 font-semibold px-6 py-3 rounded-xl transition-all"
            >
              <StopCircle className="w-5 h-5" />
              Stop Scanner
            </button>
          )}
        </div>
      </div>

      {/* Manual lookup */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Manual Registration ID Lookup</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && processRegistrationId(manualId)}
            className="flex-1 bg-[#0d0220] border border-purple-900/40 rounded-xl py-3 px-4 text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
            placeholder="e.g. JSCE-ABC123-DEF456"
            disabled={loading}
          />
          <button
            onClick={() => processRegistrationId(manualId)}
            disabled={loading || !manualId.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 spinner" /> : <Search className="w-5 h-5" />}
            Check
          </button>
        </div>
      </div>

      {/* Result display */}
      {loading && !scanResult && (
        <div className="glass rounded-2xl p-8 text-center border border-purple-900/30">
          <Loader2 className="w-10 h-10 text-purple-400 spinner mx-auto mb-3" />
          <p className="text-slate-400">Validating ticket...</p>
        </div>
      )}

      {scanResult && (
        <div
          className={`rounded-2xl p-6 border ${getResultColors(scanResult.result || 'invalid').bg} transition-all`}
        >
          {(() => {
            const { icon: Icon, iconColor, title } = getResultColors(scanResult.result || 'invalid');
            return (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Icon className={`w-8 h-8 ${iconColor}`} />
                  <h3 className={`font-black text-lg ${iconColor}`}>{title}</h3>
                </div>

                {scanResult.studentName && (
                  <div className="space-y-2">
                    {[
                      ['Student Name', scanResult.studentName],
                      ['Department', scanResult.department],
                      ['College ID', scanResult.collegeId],
                      ['Registration ID', scanResult.registrationId],
                      ...(scanResult.enteredAt ? [['Entry Time', formatDate(scanResult.enteredAt)]] : []),
                    ].map(([label, value]) => value && (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!scanResult.studentName && (
                  <p className="text-slate-300">{scanResult.message}</p>
                )}

                <button
                  onClick={() => { setScanResult(null); setManualId(''); }}
                  className="mt-5 w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-sm transition-all"
                >
                  Scan Next
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

