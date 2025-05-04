
import React from 'react';
import { VideoChatProvider } from '@/contexts/VideoChatContext';
import { useVideoChat } from '@/contexts/VideoChatContext';
import { cn } from '@/lib/utils';
import VideoDisplay from '@/components/VideoDisplay';
import ChatInterface from '@/components/ChatInterface';
import ChatControls from '@/components/ChatControls';
import Header from '@/components/Header';
import ReportDialog from '@/components/ReportDialog';
import TermsAndGuidelines from '@/components/TermsAndGuidelines';
import { Separator } from '@/components/ui/separator';

// Inner component that uses the context
const VideoChatApp: React.FC = () => {
  const { chatMode } = useVideoChat();
  
  return (
    <div className="flex flex-col min-h-screen p-4 gap-4 w-full max-w-6xl mx-auto">
      <Header />
      <Separator />
      
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Video Section - Full width on mobile, 4/7 on desktop */}
        <div 
          className={cn(
            "lg:col-span-4 flex flex-col gap-4",
            chatMode === 'text' && "lg:hidden"
          )}
        >
          <VideoDisplay className="h-[50vh] lg:h-auto rounded-lg overflow-hidden border border-border shadow-sm" />
        </div>
        
        {/* Chat Section - Full width on mobile, 3/7 on desktop */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1 border border-border rounded-lg p-4 shadow-sm">
            <ChatInterface className="h-full" />
          </div>
        </div>
      </main>
      
      <div className="flex flex-col gap-4 mt-auto">
        <ChatControls />
        
        <div className="flex justify-between items-center">
          <ReportDialog />
          <TermsAndGuidelines />
        </div>
      </div>
    </div>
  );
};

// Wrapper component that provides the context
const Index: React.FC = () => {
  return (
    <VideoChatProvider>
      <VideoChatApp />
    </VideoChatProvider>
  );
};

export default Index;
