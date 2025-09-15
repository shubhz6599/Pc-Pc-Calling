import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RtcSignalingService } from '../services/rtc-signaling.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-agent-dashboard',
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('remoteAudio') remoteAudio!: ElementRef<HTMLAudioElement>;

  agentName = 'Helpdesk-1';
  incomingSupplierId: string | null = null;
  inCallWith: string | null = null;
  subs: Subscription[] = [];

  constructor(public rtc: RtcSignalingService) {}

  ngOnInit() {
    this.rtc.connect();
    this.rtc.registerAgent(this.agentName);

    this.subs.push(this.rtc.onIncomingCall.subscribe((data) => {
      if (data) this.incomingSupplierId = data.supplierId;
    }));

    this.subs.push(this.rtc.onCallStarted.subscribe(async (data) => {
      if (data?.supplierId) {
        this.inCallWith = data.supplierId;
        // start as callee (isCaller=false)
        await this.rtc.startCallWith(data.supplierId, false);
      }
    }));

    this.subs.push(this.rtc.onRemoteStream.subscribe(stream => {
      if (stream && this.remoteAudio) {
        this.remoteAudio.nativeElement.srcObject = stream;
        this.remoteAudio.nativeElement.play().catch(()=>{});
      }
    }));

    this.subs.push(this.rtc.onCallEnded.subscribe(() => {
      this.inCallWith = null;
      this.incomingSupplierId = null;
      this.cleanupAudio();
    }));
  }

  accept() {
    if (!this.incomingSupplierId) return;
    this.rtc.agentAccept(this.incomingSupplierId);
    this.incomingSupplierId = null;
  }

  reject() {
    if (!this.incomingSupplierId) return;
    this.rtc.agentReject(this.incomingSupplierId);
    this.incomingSupplierId = null;
  }

  endCall() {
    if (this.inCallWith) {
      this.rtc.endCall(this.inCallWith);
      this.inCallWith = null;
    }
  }

  private cleanupAudio() {
    try { if (this.remoteAudio) (this.remoteAudio.nativeElement as HTMLMediaElement).srcObject = null; } catch {}
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.inCallWith) this.endCall();
  }
}
