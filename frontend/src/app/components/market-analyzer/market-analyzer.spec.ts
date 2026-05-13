import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketAnalyzer } from './market-analyzer';

describe('MarketAnalyzer', () => {
  let component: MarketAnalyzer;
  let fixture: ComponentFixture<MarketAnalyzer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketAnalyzer],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketAnalyzer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
