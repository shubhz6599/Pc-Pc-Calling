import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierCallComponent } from './supplier-call.component';

describe('SupplierCallComponent', () => {
  let component: SupplierCallComponent;
  let fixture: ComponentFixture<SupplierCallComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SupplierCallComponent]
    });
    fixture = TestBed.createComponent(SupplierCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
