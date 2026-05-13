import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeBots } from './free-bots';

describe('FreeBots', () => {
  let component: FreeBots;
  let fixture: ComponentFixture<FreeBots>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeBots],
    }).compileComponents();

    fixture = TestBed.createComponent(FreeBots);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
