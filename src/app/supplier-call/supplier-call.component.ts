import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { RtcSignalingService } from 'src/app/services/rtc-signaling.service';

@Component({
  selector: 'app-supplier-call',
  templateUrl: './supplier-call.component.html',
  styleUrls: ['./supplier-call.component.css']
})
export class SupplierCallComponent implements OnInit, OnDestroy {
  @ViewChild('remoteAudio') remoteAudio!: ElementRef<HTMLAudioElement>;

  subs: Subscription[] = [];
  queuePosition: number | null = null;
  callStatus = 'idle';
  partnerAgentId: string | null = null;

  constructor(public rtc: RtcSignalingService) {}

  ngOnInit() {
    this.rtc.connect();

    this.subs.push(this.rtc.onQueueStatus.subscribe(pos => {
      this.queuePosition = pos;
      this.callStatus = pos ? `In queue (#${pos})` : this.callStatus;
    }));

    this.subs.push(this.rtc.onCallRequested.subscribe(data => {
      if (data?.agentId) {
        this.callStatus = 'Ringing agent...';
        this.partnerAgentId = data.agentId;
      }
    }));

    this.subs.push(this.rtc.onCallAccepted.subscribe(async (data) => {
      if (data?.agentId) {
        this.callStatus = 'Connected - establishing audio';
        this.partnerAgentId = data.agentId;
        await this.rtc.startCallWith(data.agentId, true); // supplier is caller
      }
    }));

    this.subs.push(this.rtc.onRemoteStream.subscribe(stream => {
      if (stream && this.remoteAudio) {
        this.remoteAudio.nativeElement.srcObject = stream;
        this.remoteAudio.nativeElement.play().catch(()=>{});
      }
    }));

    this.subs.push(this.rtc.onCallEnded.subscribe(() => {
      this.callStatus = 'Call ended';
      this.cleanupAudio();
    }));
  }

  callHelpdesk() {
    this.callStatus = 'Requesting helpdesk...';
    this.rtc.supplierCall();
  }

  hangup() {
    if (this.partnerAgentId) {
      this.rtc.endCall(this.partnerAgentId);
      this.partnerAgentId = null;
      this.callStatus = 'Ended';
    }
  }

  private cleanupAudio() {
    try { if (this.remoteAudio) (this.remoteAudio.nativeElement as HTMLMediaElement).srcObject = null; } catch {}
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.hangup();
  }
}
