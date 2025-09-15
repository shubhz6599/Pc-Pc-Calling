import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RtcSignalingService {
  private socket!: Socket;
  public socketId:any = '';
  public onQueueStatus = new BehaviorSubject<number | null>(null);
  public onCallRequested = new BehaviorSubject<any | null>(null);
  public onIncomingCall = new BehaviorSubject<any | null>(null);
  public onCallAccepted = new BehaviorSubject<any | null>(null);
  public onCallStarted = new BehaviorSubject<any | null>(null);
  public onCallEnded = new BehaviorSubject<any | null>(null);
  public onAgentRegistered = new BehaviorSubject<any | null>(null);

  // WebRTC
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  public onLocalStream = new BehaviorSubject<MediaStream | null>(null);
  public onRemoteStream = new BehaviorSubject<MediaStream | null>(null);

  // set this to your server URL (if server on another machine use http://<server-ip>:3000)
  private signalingUrl = 'http://localhost:4000';
  private config: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  connect(url?: string) {
    if (url) this.signalingUrl = url;
    if (this.socket) return;
    this.socket = io(this.signalingUrl);

    this.socket.on('connect', () => {
      this.socketId = this.socket.id;
      console.log('socket connected', this.socketId);
    });

    this.socket.on('queue-status', (data: any) => this.onQueueStatus.next(data.position));
    this.socket.on('call-requested', (data: any) => this.onCallRequested.next(data));
    this.socket.on('incoming-call', (data: any) => this.onIncomingCall.next(data));
    this.socket.on('call-accepted', (data: any) => this.onCallAccepted.next(data));
    this.socket.on('call-started', (data: any) => this.onCallStarted.next(data));
    this.socket.on('call-ended', (data: any) => this.onCallEnded.next(data));
    this.socket.on('agent-registered', (data: any) => this.onAgentRegistered.next(data));

    // WebRTC relay handlers
    this.socket.on('webrtc-offer', async (data: any) => {
      await this.ensureLocalStream();
      await this.createPeerConnection(data.from);
      if (!this.pc) return;
      await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.socket.emit('webrtc-answer', { to: data.from, sdp: answer });
    });

    this.socket.on('webrtc-answer', async (data: any) => {
      if (this.pc) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    });

    this.socket.on('webrtc-candidate', async (data: any) => {
      if (!data || !data.candidate || !this.pc) return;
      try { await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate)); }
      catch (e) { console.warn('addIceCandidate failed', e); }
    });
  }

  // Supplier requests a call
  supplierCall() {
    if (!this.socket) this.connect();
    this.socket.emit('supplier-call');
  }

  // Agent registers
  registerAgent(name: string) {
    if (!this.socket) this.connect();
    this.socket.emit('agent-register', { name });
  }

  agentAccept(supplierId: string) {
    if (!this.socket) this.connect();
    this.socket.emit('agent-accept', { supplierId });
  }

  agentReject(supplierId: string) {
    if (!this.socket) this.connect();
    this.socket.emit('agent-reject', { supplierId });
  }

  endCall(partnerId: string) {
    if (this.socket) this.socket.emit('end-call', { partnerId });
    this.cleanup();
  }

  // ---- WebRTC helpers (audio-only) ----
  private async ensureLocalStream() {
    if (!this.localStream) {
      // audio-only
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.onLocalStream.next(this.localStream);
    }
  }

  async startCallWith(partnerId: string, isCaller: boolean) {
    await this.ensureLocalStream();
    await this.createPeerConnection(partnerId);
    if (!this.pc) return;
    if (isCaller) {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.socket.emit('webrtc-offer', { to: partnerId, sdp: offer });
    }
  }

  private async createPeerConnection(partnerId?: string) {
    if (this.pc) {
      try { this.pc.close(); } catch {}
      this.pc = null;
    }

    this.pc = new RTCPeerConnection(this.config);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => this.pc!.addTrack(track, this.localStream!));
    }

    this.remoteStream = new MediaStream();
    this.onRemoteStream.next(this.remoteStream);

    this.pc.ontrack = (ev) => {
      ev.streams[0].getTracks().forEach(t => this.remoteStream!.addTrack(t));
      this.onRemoteStream.next(this.remoteStream);
    };

    this.pc.onicecandidate = (ev) => {
      if (ev.candidate && partnerId) {
        this.socket.emit('webrtc-candidate', { to: partnerId, candidate: ev.candidate });
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('pc state', this.pc?.connectionState);
    };
  }

  private cleanup() {
    try { this.pc?.close(); } catch {}
    this.pc = null;
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
      this.onLocalStream.next(null);
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(t => t.stop());
      this.remoteStream = null;
      this.onRemoteStream.next(null);
    }
  }
}
