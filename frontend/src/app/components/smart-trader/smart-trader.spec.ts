import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartTrader } from './smart-trader';

describe('SmartTrader', () => {
  let component: SmartTrader;
  let fixture: ComponentFixture<SmartTrader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartTrader],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartTrader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
