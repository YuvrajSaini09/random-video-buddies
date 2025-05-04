
import React from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useVideoChat } from '@/contexts/VideoChatContext';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Header: React.FC = () => {
  const { chatMode, setChatMode } = useVideoChat();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary/90 to-purple-400 text-transparent bg-clip-text">
          StrangerChat
        </h1>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <Switch 
                id="video-mode" 
                checked={chatMode === 'video'}
                onCheckedChange={(checked) => setChatMode(checked ? 'video' : 'text')}
              />
              <Label htmlFor="video-mode" className="cursor-pointer">
                Video Mode
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle between video and text-only mode</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default Header;
