import { TestBed } from '@angular/core/testing';

import { RtcSignalingService } from './rtc-signaling.service';

describe('RtcSignalingService', () => {
  let service: RtcSignalingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RtcSignalingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
