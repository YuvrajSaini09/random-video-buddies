
import React, { useState, useRef, useEffect } from 'react';
import { useVideoChat } from '@/contexts/VideoChatContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const { messages, sendMessage, isConnected } = useVideoChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isConnected) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-y-auto pr-2 messages-container">
        {messages.length > 0 ? (
          <div className="flex flex-col gap-3 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[80%] px-4 py-2 rounded-lg",
                  message.isLocal 
                    ? "self-end bg-primary text-primary-foreground" 
                    : "self-start bg-muted"
                )}
              >
                <p className="break-words">{message.text}</p>
                <span className={cn(
                  "text-[10px] block mt-1",
                  message.isLocal ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {format(message.timestamp, 'HH:mm')}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              {isConnected 
                ? "No messages yet. Say hello!" 
                : "Connect with someone to start chatting"}
            </p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <Input
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isConnected}
          className="flex-1"
          autoComplete="off"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!isConnected || !inputValue.trim()}
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;
