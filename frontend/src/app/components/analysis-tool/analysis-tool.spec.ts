import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisTool } from './analysis-tool';

describe('AnalysisTool', () => {
  let component: AnalysisTool;
  let fixture: ComponentFixture<AnalysisTool>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisTool],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisTool);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
