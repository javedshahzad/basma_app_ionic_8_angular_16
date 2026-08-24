import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Only used to embed video-material links (e.g. YouTube/Vimeo) supplied by
// the backend in an <iframe src>. Restricting to http(s) before bypassing
// Angular's sanitizer blocks a malicious material_video_link value (e.g.
// javascript:/data: URIs) from being trusted as embeddable content.
const SAFE_URL_SCHEME = /^https?:\/\//i;

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeResourceUrl | string {
    if (!value || !SAFE_URL_SCHEME.test(value)) return '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }
}
