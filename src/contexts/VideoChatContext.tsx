
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/sonner';

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

// Mock functions for demonstration
const generateRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

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
  
  // Simulate random online users
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(generateRandomNumber(50, 200));
    }, 10000);
    
    setOnlineUsers(generateRandomNumber(50, 200));
    
    return () => clearInterval(interval);
  }, []);

  const startChat = async () => {
    try {
      setIsConnecting(true);
      
      // Request permissions and get local stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      // Simulate finding a partner
      setIsFindingPartner(true);
      
      // Simulate connection delay
      setTimeout(() => {
        // For demo purposes, create a mock remote stream
        const mockRemoteStream = new MediaStream();
        setRemoteStream(mockRemoteStream);
        
        setIsConnected(true);
        setIsConnecting(false);
        setIsFindingPartner(false);
        
        toast.success("Connected to a stranger!");
      }, 2000);
      
    } catch (error) {
      console.error('Failed to start chat:', error);
      setIsConnecting(false);
      toast.error("Failed to access camera and microphone. Please check permissions.");
    }
  };

  const findNewPartner = async () => {
    setIsConnected(false);
    setIsFindingPartner(true);
    setMessages([]);
    
    // Simulate finding a new partner
    setTimeout(() => {
      setIsConnected(true);
      setIsFindingPartner(false);
      toast.success("Connected to a new stranger!");
    }, 1500);
  };

  const endChat = () => {
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

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isLocal: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate receiving a response
    setTimeout(() => {
      const responses = [
        "Hey there!",
        "Nice to meet you!",
        "Where are you from?",
        "How's your day going?",
        "That's interesting!",
        "I'm enjoying this chat.",
        "Do you have any hobbies?",
        "What brings you here today?",
        "Cool!",
        "I see what you mean."
      ];
      
      const remoteMessage: Message = {
        id: Date.now().toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        isLocal: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, remoteMessage]);
    }, generateRandomNumber(1000, 3000));
  };

  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

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
        setChatMode,
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
