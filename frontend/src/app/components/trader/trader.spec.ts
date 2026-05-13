import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Trader } from './trader';

describe('Trader', () => {
  let component: Trader;
  let fixture: ComponentFixture<Trader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trader],
    }).compileComponents();

    fixture = TestBed.createComponent(Trader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
