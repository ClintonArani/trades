import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthError } from './auth-error';

describe('AuthError', () => {
  let component: AuthError;
  let fixture: ComponentFixture<AuthError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthError],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthError);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
