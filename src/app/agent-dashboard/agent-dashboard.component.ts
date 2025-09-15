import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RtcSignalingService } from '../services/rtc-signaling.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-agent-dashboard',
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit {
  @ViewChild('remoteAudio') remoteAudio!: ElementRef<HTMLAudioElement>;

  agentName = '';
  incomingSupplierId: string | null = null;
  inCallWith: string | null = null;
  subs: Subscription[] = [];

  constructor(public rtc: RtcSignalingService) {}

  ngOnInit() {
  this.rtc.connect();
  this.rtc.registerAgent();

  this.subs.push(this.rtc.onAgentRegistered.subscribe(data => {
    if (data?.name) this.agentName = data.name;
  }));

  this.subs.push(this.rtc.onIncomingCall.subscribe(data => {
    if (data) this.incomingSupplierId = data.supplierId;
  }));

  this.subs.push(this.rtc.onCallStarted.subscribe(async data => {
    if (data?.supplierId) {
      this.inCallWith = data.supplierId;
      await this.rtc.startCallWith(data.supplierId, false); // callee
    }
  }));

  this.subs.push(this.rtc.onRemoteStream.subscribe(stream => {
    if (stream && this.remoteAudio) {
      this.remoteAudio.nativeElement.srcObject = stream;
      this.remoteAudio.nativeElement.play().catch(() => {});
    }
  }));

  // ✅ Listen for call-ended from supplier or self
  this.subs.push(this.rtc.onCallEnded.subscribe(() => {
    this.cleanupCall();
  }));

  this.subs.push(this.rtc.onCallRejected.subscribe(() => this.cleanupCall()));
}

accept() {
  if (!this.incomingSupplierId) return;
  this.rtc.agentAccept(this.incomingSupplierId);
  this.incomingSupplierId = null;
}

reject() {
  if (!this.incomingSupplierId) return;
  this.rtc.agentReject(this.incomingSupplierId);
  this.cleanupCall(); // reset UI immediately
}


endCall() {
  if (this.inCallWith) {
    this.rtc.endCall(this.inCallWith);
    this.cleanupCall();
  }
}

private cleanupCall() {
  this.inCallWith = null;
  this.incomingSupplierId = null;

  // Stop remote audio
  try {
    if (this.remoteAudio && this.remoteAudio.nativeElement.srcObject) {
      const stream = this.remoteAudio.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.remoteAudio.nativeElement.srcObject = null;
    }
  } catch {}
}

}
