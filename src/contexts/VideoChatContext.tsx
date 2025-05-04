
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/sonner';
import chatService, { ChatMessage } from '@/services/ChatService';
import { v4 as uuidv4 } from 'uuid';

type ChatMode = 'video' | 'text';

interface VideoChatContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting: boolean;
  isFindingPartner: boolean;
  onlineUsers: number;
  chatMode: ChatMode;
  messages: Message[];
  videoEnabled: boolean;
  audioEnabled: boolean;
  
  startChat: () => Promise<void>;
  findNewPartner: () => Promise<void>;
  endChat: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  setChatMode: (mode: ChatMode) => void;
  sendMessage: (text: string) => void;
}

interface Message {
  id: string;
  text: string;
  isLocal: boolean;
  timestamp: Date;
}

const VideoChatContext = createContext<VideoChatContextType | undefined>(undefined);

export const VideoChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFindingPartner, setIsFindingPartner] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [chatMode, setChatMode] = useState<ChatMode>('video');
  const [messages, setMessages] = useState<Message[]>([]);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Initialize service and fetch online user count
  useEffect(() => {
    const initializeService = async () => {
      try {
        await chatService.initUser(chatMode);
        updateOnlineUserCount();
        
        // Set up interval to update online user count
        const interval = setInterval(updateOnlineUserCount, 10000);
        
        return () => {
          clearInterval(interval);
          chatService.cleanup();
        };
      } catch (error) {
        console.error("Error initializing chat service:", error);
      }
    };
    
    initializeService();
  }, []);

  // Update online user count
  const updateOnlineUserCount = async () => {
    const count = await chatService.getOnlineUserCount();
    setOnlineUsers(count);
  };

  // Process incoming message
  const handleNewMessage = (message: ChatMessage) => {
    const newMessage: Message = {
      id: message.id,
      text: message.message,
      isLocal: message.userId === chatService.getUserId(),
      timestamp: message.createdAt
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  // Start chat session
  const startChat = async () => {
    try {
      setIsConnecting(true);
      
      // Request media permissions
      const stream = await chatService.setupLocalStream(chatMode === 'video', true);
      if (!stream) {
        setIsConnecting(false);
        return;
      }
      
      setLocalStream(stream);
      setVideoEnabled(chatMode === 'video');
      setAudioEnabled(true);
      
      // Find a partner
      setIsFindingPartner(true);
      const partnerFound = await chatService.findPartner(chatMode);
      
      if (partnerFound) {
        setIsConnected(true);
        setIsConnecting(false);
        setIsFindingPartner(false);
        
        // Subscribe to new messages
        const unsubscribe = chatService.subscribeToMessages(handleNewMessage);
        
        // Load existing messages
        const existingMessages = await chatService.getMessages();
        const formattedMessages = existingMessages.map(msg => ({
          id: msg.id,
          text: msg.message,
          isLocal: msg.userId === chatService.getUserId(),
          timestamp: msg.createdAt
        }));
        
        setMessages(formattedMessages);
        
        // Get remote stream if available
        const remoteStr = chatService.getRemoteStream();
        if (remoteStr) {
          setRemoteStream(remoteStr);
        }
        
        toast.success("Connected to a stranger!");
      } else {
        setIsConnecting(false);
        setIsFindingPartner(false);
        toast.error("No one is available right now. Try again later.");
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      setIsConnecting(false);
      toast.error("Failed to access camera and microphone. Please check permissions.");
    }
  };

  // Find a new partner
  const findNewPartner = async () => {
    setIsConnected(false);
    setIsFindingPartner(true);
    setMessages([]);
    
    // End current chat
    await chatService.endChat();
    
    // Find a new partner
    const partnerFound = await chatService.findPartner(chatMode);
    
    if (partnerFound) {
      setIsConnected(true);
      setIsFindingPartner(false);
      toast.success("Connected to a new stranger!");
      
      // Subscribe to new messages
      chatService.subscribeToMessages(handleNewMessage);
    } else {
      setIsFindingPartner(false);
      toast.error("No one is available right now. Try again later.");
    }
  };

  // End the chat
  const endChat = () => {
    chatService.endChat();
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    setIsFindingPartner(false);
    setMessages([]);
  };

  // Toggle video
  const toggleVideo = () => {
    const newState = !videoEnabled;
    chatService.toggleVideo(newState);
    setVideoEnabled(newState);
  };

  // Toggle audio
  const toggleAudio = () => {
    const newState = !audioEnabled;
    chatService.toggleAudio(newState);
    setAudioEnabled(newState);
  };

  // Send a message
  const sendMessage = (text: string) => {
    if (!text.trim() || !isConnected) return;
    
    chatService.sendMessage(text);
    
    const newMessage: Message = {
      id: uuidv4(),
      text,
      isLocal: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  // Update chat mode
  const handleSetChatMode = (mode: ChatMode) => {
    setChatMode(mode);
    chatService.endChat();
  };

  return (
    <VideoChatContext.Provider
      value={{
        localStream,
        remoteStream,
        isConnected,
        isConnecting,
        isFindingPartner,
        onlineUsers,
        chatMode,
        messages,
        videoEnabled,
        audioEnabled,
        startChat,
        findNewPartner,
        endChat,
        toggleVideo,
        toggleAudio,
        setChatMode: handleSetChatMode,
        sendMessage
      }}
    >
      {children}
    </VideoChatContext.Provider>
  );
};

export const useVideoChat = () => {
  const context = useContext(VideoChatContext);
  if (context === undefined) {
    throw new Error('useVideoChat must be used within a VideoChatProvider');
  }
  return context;
};
