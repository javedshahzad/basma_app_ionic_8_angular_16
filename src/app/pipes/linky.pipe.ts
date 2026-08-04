import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linky'
})
export class LinkyPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml | string {
    if (!value) return value;

    // 🔒 تعقيم النص بالكامل أولاً حتى لا يتحول أي HTML/سكريبت داخل الرسالة
    // (المُرسلة من مستخدم آخر) إلى عناصر حقيقية بعد bypassSecurityTrustHtml
    const escaped = this.escapeHtml(value);

    // خوارزمية (Regex) للبحث عن أي روابط إنترنت
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // استبدال الرابط النصي بكود HTML (أزلنا (click) لأن Angular لا يقرأها هنا)
    const linkedText = escaped.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 font-bold hover:text-indigo-800 underline transition-colors">${url}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(linkedText);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

}