import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotBuilder } from './bot-builder';

describe('BotBuilder', () => {
  let component: BotBuilder;
  let fixture: ComponentFixture<BotBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(BotBuilder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
