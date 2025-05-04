
import React from 'react';
import { Button } from "@/components/ui/button";
import { useVideoChat } from '@/contexts/VideoChatContext';
import { Video, VideoOff, Mic, MicOff, Users, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatControlsProps {
  className?: string;
}

const ChatControls: React.FC<ChatControlsProps> = ({ className }) => {
  const { 
    startChat, 
    findNewPartner, 
    endChat, 
    toggleVideo, 
    toggleAudio, 
    videoEnabled, 
    audioEnabled, 
    isConnected, 
    isConnecting,
    isFindingPartner,
    onlineUsers
  } = useVideoChat();

  return (
    <div className={cn("flex flex-col w-full gap-4", className)}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <span className="text-sm">{onlineUsers} online</span>
        </div>
        
        {isConnecting && !isConnected && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow"></div>
            <span className="text-sm">
              {isFindingPartner ? "Finding partner..." : "Connecting..."}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-between sm:items-center w-full">
        {!isConnected && !isConnecting ? (
          <Button 
            onClick={startChat} 
            className="col-span-2 bg-primary hover:bg-primary/90"
          >
            Start Chat
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              className={cn("aspect-square", !videoEnabled && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              onClick={toggleVideo}
            >
              {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={cn("aspect-square", !audioEnabled && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              onClick={toggleAudio}
            >
              {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </Button>

            {isConnected && (
              <Button
                variant="secondary"
                onClick={findNewPartner}
                className="gap-2"
              >
                <RefreshCcw size={16} />
                Next
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={endChat}
            >
              End Chat
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatControls;
