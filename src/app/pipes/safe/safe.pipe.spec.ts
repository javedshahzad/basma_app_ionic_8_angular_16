import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafePipe } from './safe.pipe';

describe('SafePipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustResourceUrl: (url: string) => url
          }
        }
      ]
    });
  });

  it('create an instance', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const pipe = new SafePipe(sanitizer);
    expect(pipe).toBeTruthy();
  });

  it('trusts http(s) URLs', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const pipe = new SafePipe(sanitizer);
    expect(pipe.transform('https://www.youtube.com/embed/abc123')).toBe('https://www.youtube.com/embed/abc123');
    expect(pipe.transform('http://example.com/video.mp4')).toBe('http://example.com/video.mp4');
  });

  it('rejects non-http(s) schemes instead of trusting them', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const pipe = new SafePipe(sanitizer);
    expect(pipe.transform('javascript:alert(1)')).toBe('');
    expect(pipe.transform('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(pipe.transform('vbscript:msgbox(1)')).toBe('');
  });

  it('returns empty string for an empty value', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const pipe = new SafePipe(sanitizer);
    expect(pipe.transform('')).toBe('');
  });
});