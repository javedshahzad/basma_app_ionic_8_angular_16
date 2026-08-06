import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: false
})
export class DateFormatPipe implements PipeTransform {
  monthNames = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  transform(value: string): string {
    if (!value) return '';

    let date = new Date(value);

    // فحص أمان: إذا كان التاريخ غير صالح، نعيد النص الأصلي بدلاً من كسر التطبيق
    if (isNaN(date.getTime())) {
      return value;
    }

    let year = date.getFullYear().toString();
    let formatedDate =
      year.slice(2, 4) +
      ' ' +
      this.monthNames[date.getMonth()] +
      ' ' +
      date.getDate() +
      ', ' +
      this.dayNames[date.getDay()];

    return formatedDate;
  }
}
