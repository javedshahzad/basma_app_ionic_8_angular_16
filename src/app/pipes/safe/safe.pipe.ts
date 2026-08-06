import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeResourceUrl | string {
    if (!value) return '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }
}
