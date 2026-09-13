import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, AlertTriangle, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureImage: (dataUrl: string) => void;
  onFallbackUpload: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureImage,
  onFallbackUpload,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    stopStream();
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream is not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      setErrorMsg(msg);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    // Flash visual feedback
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stopStream();
      onCaptureImage(dataUrl);
      onClose();
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg h-[85vh] flex flex-col bg-slate-950 rounded-2xl border border-white/15 overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <span className="text-sm font-semibold text-white">Live Document Scanner</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCamera}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
              title="Switch camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
              <p className="text-sm text-slate-300">Camera access unavailable</p>
              <p className="text-xs text-slate-500 max-w-xs">{errorMsg}</p>
              <button
                onClick={() => {
                  onClose();
                  onFallbackUpload();
                }}
                className="btn-primary text-xs py-2 px-4 mt-2 flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Upload from Gallery / Files</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Document Framing Guidelines */}
              <div className="absolute inset-8 border-2 border-dashed border-sky-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-sky-400" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-sky-400" />
                </div>
                <div className="text-center text-xs text-white/80 font-medium drop-shadow-md">
                  Align paper edges inside the frame
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-sky-400" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-sky-400" />
                </div>
              </div>

              {/* Shutter Flash Effect */}
              {flash && (
                <div className="absolute inset-0 bg-white z-30 transition-opacity duration-200" />
              )}
            </>
          )}
        </div>

        {/* Bottom Shutter Controls */}
        {!errorMsg && (
          <div className="p-5 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center gap-6">
            <button
              onClick={() => {
                onClose();
                onFallbackUpload();
              }}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              title="Upload existing photo"
            >
              <Upload className="w-4 h-4 text-slate-300" />
              <span>Gallery</span>
            </button>

            {/* Main Round Shutter Button */}
            <button
              onClick={handleCapture}
              className="w-18 h-18 rounded-full border-4 border-white p-1.5 flex items-center justify-center transition-transform active:scale-95 shadow-xl cursor-pointer"
            >
              <div className="w-full h-full bg-sky-500 rounded-full shadow-lg hover:bg-sky-400 transition-colors" />
            </button>

            <div className="w-20" />
          </div>
        )}
      </div>
    </div>
  );
};
