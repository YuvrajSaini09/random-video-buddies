
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";

// Types
export interface User {
  id: string;
  status: string;
  chatMode: string;
}

export interface ChatRoom {
  id: string;
  status: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: Date;
}

// WebRTC configuration
const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
};

class ChatService {
  private userId: string;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentRoom: string | null = null;
  private partnerId: string | null = null;
  private channel: any = null;
  
  constructor() {
    this.userId = uuidv4();
  }

  // Initialize user in the online users table
  async initUser(chatMode: string = 'video'): Promise<void> {
    try {
      await supabase.from('online_users').insert({
        user_id: this.userId,
        status: 'available',
        chat_mode: chatMode
      });

      console.log('User initialized:', this.userId);
      
      // Setup realtime subscription for matching
      this.setupRealtimeSubscription();
      
    } catch (error) {
      console.error('Error initializing user:', error);
      toast.error("Failed to connect to the server");
    }
  }

  private setupRealtimeSubscription(): void {
    // Listen for chat room invitations
    this.channel = supabase
      .channel('chat_events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_participants',
        filter: `user_id=eq.${this.userId}`
      }, this.handleRoomInvitation.bind(this))
      .subscribe();
  }

  private async handleRoomInvitation(payload: any): Promise<void> {
    const { room_id } = payload.new;
    this.currentRoom = room_id;
    
    // Get partner information
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('room_id', room_id)
      .neq('user_id', this.userId);

    if (participants && participants.length > 0) {
      this.partnerId = participants[0].user_id;
      
      // Update user status
      await supabase
        .from('online_users')
        .update({ status: 'busy' })
        .eq('user_id', this.userId);
      
      // If we're the caller (the one who initiated the chat)
      if (payload.new.is_caller) {
        this.createPeerConnection();
        this.createOffer();
      }
    }
  }

  // Find a new chat partner
  async findPartner(chatMode: string = 'video'): Promise<boolean> {
    try {
      // Update user status and mode
      await supabase
        .from('online_users')
        .update({
          status: 'searching',
          chat_mode: chatMode,
          last_active: new Date().toISOString() // Fixed: Convert Date to string
        })
        .eq('user_id', this.userId);
      
      // Find available partner with matching chat mode
      const { data: availableUsers } = await supabase
        .from('online_users')
        .select('user_id')
        .eq('status', 'available')
        .eq('chat_mode', chatMode)
        .neq('user_id', this.userId)
        .order('last_active', { ascending: false })
        .limit(1);
      
      if (availableUsers && availableUsers.length > 0) {
        const partnerId = availableUsers[0].user_id;
        this.partnerId = partnerId;
        
        // Create a new chat room
        const { data: room } = await supabase
          .from('chat_rooms')
          .insert({ status: 'active' })
          .select()
          .single();
        
        if (room) {
          this.currentRoom = room.id;
          
          // Add both users to the room
          await supabase.from('chat_participants').insert([
            { room_id: room.id, user_id: this.userId, is_caller: true },
            { room_id: room.id, user_id: partnerId, is_caller: false }
          ]);
          
          // Update both users' status
          await supabase
            .from('online_users')
            .update({ status: 'busy' })
            .in('user_id', [this.userId, partnerId]);
          
          return true;
        }
      }
      
      // No partner found, keep searching
      return false;
      
    } catch (error) {
      console.error('Error finding partner:', error);
      toast.error("Failed to find a chat partner");
      return false;
    }
  }

  // Set up local media stream
  async setupLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: audio
      });
      return this.localStream;
    } catch (error) {
      console.error('Error getting user media:', error);
      toast.error("Failed to access camera and microphone");
      return null;
    }
  }

  // Create WebRTC peer connection
  private async createPeerConnection(): Promise<void> {
    try {
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
      
      // Add local tracks to the connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }
      
      // Handle incoming remote tracks
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        console.log('Remote track received:', this.remoteStream);
      };
      
      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          // Send ICE candidate to the partner via Supabase
          await this.sendSignalingData({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Subscribe to signaling data
      await this.subscribeToSignalingChannel();
      
    } catch (error) {
      console.error('Error creating peer connection:', error);
      toast.error("Failed to establish connection");
    }
  }

  // Create and send WebRTC offer
  private async createOffer(): Promise<void> {
    try {
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }
      
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      
      // Send offer to the partner via Supabase
      await this.sendSignalingData({
        type: 'offer',
        sdp: this.peerConnection!.localDescription
      });
      
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  // Handle incoming WebRTC offer
  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }
      
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create and send answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      
      await this.sendSignalingData({
        type: 'answer',
        sdp: this.peerConnection!.localDescription
      });
      
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  // Handle incoming WebRTC answer
  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  // Handle incoming ICE candidate
  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Send signaling data through Supabase
  private async sendSignalingData(data: any): Promise<void> {
    if (!this.currentRoom || !this.partnerId) return;
    
    try {
      await supabase.from('chat_messages').insert({
        room_id: this.currentRoom,
        user_id: this.userId,
        message: JSON.stringify({ signal: data }),
        is_signal: true
      });
    } catch (error) {
      console.error('Error sending signaling data:', error);
    }
  }

  // Subscribe to signaling channel
  private async subscribeToSignalingChannel(): Promise<void> {
    if (!this.currentRoom) return;
    
    supabase
      .channel(`room-${this.currentRoom}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${this.currentRoom} AND user_id=neq.${this.userId} AND is_signal=eq.true`
      }, this.handleSignalingMessage.bind(this))
      .subscribe();
  }

  // Handle incoming signaling message
  private async handleSignalingMessage(payload: any): Promise<void> {
    try {
      const message = JSON.parse(payload.new.message);
      
      if (!message.signal) return;
      
      const signal = message.signal;
      
      switch (signal.type) {
        case 'offer':
          await this.handleOffer(signal.sdp);
          break;
        case 'answer':
          await this.handleAnswer(signal.sdp);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(signal.candidate);
          break;
        default:
          console.log('Unknown signal type:', signal.type);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  // Send a text message
  async sendMessage(text: string): Promise<void> {
    if (!this.currentRoom || !text.trim()) return;
    
    try {
      await supabase.from('chat_messages').insert({
        room_id: this.currentRoom,
        user_id: this.userId,
        message: text,
        is_signal: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  }

  // Get messages for the current chat room
  async getMessages(): Promise<ChatMessage[]> {
    if (!this.currentRoom) return [];
    
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, user_id, message, created_at')
        .eq('room_id', this.currentRoom)
        .eq('is_signal', false)
        .order('created_at', { ascending: true });
      
      return (data || []).map(msg => ({
        id: msg.id,
        userId: msg.user_id,
        message: msg.message,
        createdAt: new Date(msg.created_at)
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Subscribe to new messages
  subscribeToMessages(callback: (message: ChatMessage) => void): () => void {
    if (!this.currentRoom) return () => {};
    
    const channel = supabase
      .channel(`messages-${this.currentRoom}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${this.currentRoom} AND is_signal=eq.false`
      }, (payload) => {
        const msg = payload.new;
        callback({
          id: msg.id,
          userId: msg.user_id,
          message: msg.message,
          createdAt: new Date(msg.created_at)
        });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }

  // End current chat and disconnect
  async endChat(): Promise<void> {
    try {
      // Close WebRTC connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }
      
      // Stop local media tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      // Remove from chat room
      if (this.currentRoom) {
        // Mark the room as ended
        await supabase
          .from('chat_rooms')
          .update({ status: 'ended' })
          .eq('id', this.currentRoom);
      }
      
      // Reset properties
      this.remoteStream = null;
      this.currentRoom = null;
      this.partnerId = null;
      
      // Update user status
      await supabase
        .from('online_users')
        .update({ status: 'available' })
        .eq('user_id', this.userId);
        
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  }

  // Toggle video
  async toggleVideo(enabled: boolean): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  // Toggle audio
  async toggleAudio(enabled: boolean): Promise<void> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  // Get online user count
  async getOnlineUserCount(): Promise<number> {
    try {
      const { count } = await supabase
        .from('online_users')
        .select('*', { count: 'exact', head: true });
      
      return count || 0;
    } catch (error) {
      console.error('Error getting online user count:', error);
      return 0;
    }
  }

  // Report a user
  async reportUser(reason: string, details?: string): Promise<void> {
    if (!this.partnerId) return;
    
    try {
      await supabase.from('user_reports').insert({
        reporter_id: this.userId,
        reported_id: this.partnerId,
        reason,
        details
      });
      
      toast.success("Report submitted successfully");
    } catch (error) {
      console.error('Error reporting user:', error);
      toast.error("Failed to submit report");
    }
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    // End any active chat
    await this.endChat();
    
    // Remove from online users
    await supabase
      .from('online_users')
      .delete()
      .eq('user_id', this.userId);
    
    // Unsubscribe from channels
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }

  // Get user ID
  getUserId(): string {
    return this.userId;
  }

  // Get remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Check if connected to a partner
  isConnectedToPartner(): boolean {
    return Boolean(this.currentRoom && this.partnerId);
  }
}

// Create a singleton instance
const chatService = new ChatService();
export default chatService;
