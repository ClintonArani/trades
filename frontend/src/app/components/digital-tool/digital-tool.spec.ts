import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalTool } from './digital-tool';

describe('DigitalTool', () => {
  let component: DigitalTool;
  let fixture: ComponentFixture<DigitalTool>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalTool],
    }).compileComponents();

    fixture = TestBed.createComponent(DigitalTool);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
