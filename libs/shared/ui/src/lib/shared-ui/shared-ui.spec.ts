import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './shared-ui';

describe('ButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults to the primary variant', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    expect(fixture.componentInstance.variant()).toBe('primary');
  });
});
