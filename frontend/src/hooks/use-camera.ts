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
      // Cap resolution — a lot of webcams default to 1080p+, which is
      // needlessly expensive for both the in-browser skeleton overlay
      // and the frames we ship to cv-service. 640x480 is plenty.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 640 },
          height: { ideal: 480, max: 480 },
          facingMode: 'user',
        },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraState('ready');
    } catch {
      setCameraState('denied');
    }
  };

  return { cameraState, videoRef, enableCamera };
}