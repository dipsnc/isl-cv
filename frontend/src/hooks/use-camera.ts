import { useEffect, useRef, useState } from 'react';

export type CameraState = 'idle' | 'requesting' | 'ready' | 'denied';

export function useCamera() {
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const enableCamera = async () => {
    setCameraState('requesting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraState('ready');
    } catch {
      setCameraState('denied');
    }
  };

  return { cameraState, videoRef, enableCamera };
}
