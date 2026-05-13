import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrequencyAnalysis } from './frequency-analysis';

describe('FrequencyAnalysis', () => {
  let component: FrequencyAnalysis;
  let fixture: ComponentFixture<FrequencyAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrequencyAnalysis],
    }).compileComponents();

    fixture = TestBed.createComponent(FrequencyAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
