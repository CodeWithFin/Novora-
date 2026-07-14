'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface UseBarcodeScannerOptions {
  onScan: (code: string) => void;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const lastScanRef = useRef<string>('');

  const stopScanner = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    readerRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopScanner();
      return;
    }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const start = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setHasCamera(false);
          setError('No camera found — use manual entry below');
          return;
        }

        const backCamera =
          devices.find((d) =>
            /back|rear|environment/i.test(d.label)
          ) ?? devices[0];

        await reader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const text = result.getText();
              if (text && text !== lastScanRef.current) {
                lastScanRef.current = text;
                onScan(text);
                setTimeout(() => {
                  lastScanRef.current = '';
                }, 2000);
              }
            }
            if (err && !(err.name === 'NotFoundException')) {
              // ignore continuous scan errors
            }
          }
        );

        const stream = videoRef.current?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & {
          torch?: boolean;
        };
        if (capabilities?.torch) {
          setTorchSupported(true);
        }
      } catch (err) {
        setHasCamera(false);
        setError(
          err instanceof Error
            ? `Camera access denied — ${err.message}. Use manual entry below.`
            : 'Camera unavailable — use manual entry below'
        );
      }
    };

    start();

    return () => {
      stopScanner();
    };
  }, [enabled, onScan, stopScanner]);

  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn((v) => !v);
    } catch {
      // torch not supported on this device
    }
  };

  return {
    videoRef,
    error,
    hasCamera,
    torchSupported,
    torchOn,
    toggleTorch,
    stopScanner,
  };
}
