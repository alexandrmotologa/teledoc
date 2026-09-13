import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

export interface OcrState {
  isProcessing: boolean;
  progress: number;
  status: string;
  text: string;
  wordCount: number;
  error: string | null;
}

export function useOcr() {
  const [state, setState] = useState<OcrState>({
    isProcessing: false,
    progress: 0,
    status: '',
    text: '',
    wordCount: 0,
    error: null,
  });

  const runOcr = useCallback(async (imageInput: string | HTMLCanvasElement, lang: string = 'eng') => {
    setState({
      isProcessing: true,
      progress: 0.05,
      status: `Initializing OCR engine (${lang})...`,
      text: '',
      wordCount: 0,
      error: null,
    });

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

    try {
      worker = await createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setState((prev) => ({
              ...prev,
              progress: Math.round(m.progress * 100),
              status: `Recognizing text (${Math.round(m.progress * 100)}%)...`,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              status: m.status || 'Processing...',
            }));
          }
        },
      });

      let targetData: string | HTMLCanvasElement = imageInput;
      if (typeof imageInput !== 'string' && imageInput.toDataURL) {
        targetData = imageInput.toDataURL('image/png');
      }

      const ret = await worker.recognize(targetData);
      const text = ret.data.text.trim();
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

      setState({
        isProcessing: false,
        progress: 100,
        status: 'Completed',
        text,
        wordCount: words,
        error: null,
      });

      return text;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown OCR error occurred';
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        status: 'Failed',
        error: errorMsg,
      }));
      throw err;
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }, []);

  const resetOcr = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      status: '',
      text: '',
      wordCount: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    runOcr,
    resetOcr,
  };
}
