import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchTrader } from './batch-trader';

describe('BatchTrader', () => {
  let component: BatchTrader;
  let fixture: ComponentFixture<BatchTrader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchTrader],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchTrader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
