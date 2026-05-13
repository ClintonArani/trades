import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FxCharts } from './fx-charts';

describe('FxCharts', () => {
  let component: FxCharts;
  let fixture: ComponentFixture<FxCharts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FxCharts],
    }).compileComponents();

    fixture = TestBed.createComponent(FxCharts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
