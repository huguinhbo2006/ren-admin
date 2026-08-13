import { Pipe, PipeTransform } from '@angular/core';

/**
 * CurrencyMxnPipe
 *
 * Convierte centavos a pesos mexicanos con formato legible.
 *
 * Uso:
 *   {{ 15000 | currencyMxn }}       → "$150.00"
 *   {{ 15000 | currencyMxn:false }} → "150.00"
 *   {{ 0 | currencyMxn }}           → "$0.00"
 */
@Pipe({
  name: 'currencyMxn',
  standalone: true,
  pure: true,
})
export class CurrencyMxnPipe implements PipeTransform {

  private readonly formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  transform(cents: number | null | undefined, showSymbol = true): string {
    if (cents == null || isNaN(cents)) return showSymbol ? '$0.00' : '0.00';

    const amount = cents / 100;

    if (!showSymbol) {
      return amount.toFixed(2);
    }

    return this.formatter.format(amount);
  }
}
