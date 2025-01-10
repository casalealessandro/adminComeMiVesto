import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timestampToDate',
  standalone: true, // Rende la pipe standalone
})
export class TimestampToDatePipe implements PipeTransform {
  transform(value: number | string | null): string {
    if (!value) {
      return '';
    }

    // Convertire il timestamp in un oggetto Date
    const date = new Date(Number(value));
    
    // Formattare la data nel formato italiano (dd/MM/yyyy)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // i mesi partono da 0
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }
}
