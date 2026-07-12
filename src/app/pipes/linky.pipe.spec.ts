import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { LinkyPipe } from './linky.pipe';

describe('LinkyPipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustHtml: (html: string) => html
          }
        }
      ]
    });
  });

  it('create an instance', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const pipe = new LinkyPipe(sanitizer);
    expect(pipe).toBeTruthy();
  });
});