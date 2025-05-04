
import React, { useRef, useEffect } from 'react';
import { useVideoChat } from '@/contexts/VideoChatContext';
import { cn } from '@/lib/utils';

interface VideoDisplayProps {
  className?: string;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ className }) => {
  const { localStream, remoteStream, isConnected, videoEnabled } = useVideoChat();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className={cn("relative flex items-center justify-center w-full h-full", className)}>
      {/* Remote video (main display) */}
      {remoteStream && isConnected ? (
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover rounded-lg bg-black"
          autoPlay
          playsInline
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center rounded-lg bg-muted">
          {isConnected ? (
            <div className="text-center p-4">
              <p className="text-lg font-medium">Partner's video is unavailable</p>
              <p className="text-sm text-muted-foreground">They might have disabled their camera</p>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-lg font-medium">No one connected</p>
              <p className="text-sm text-muted-foreground">Click "Start Chat" to find someone</p>
            </div>
          )}
        </div>
      )}

      {/* Local video (picture-in-picture) */}
      {localStream && (
        <div className="absolute bottom-4 right-4 w-1/4 h-auto max-h-40 rounded-md overflow-hidden border-2 border-primary shadow-lg">
          {videoEnabled ? (
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover bg-black"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="w-full h-full aspect-video bg-muted flex items-center justify-center">
              <p className="text-xs text-center">Camera Off</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;
