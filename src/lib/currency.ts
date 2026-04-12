export function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = {
    GBP: '£', USD: '$', EUR: '€', JPY: '¥', CNY: '¥', INR: '₹', AUD: 'A$', CAD: 'C$',
    CHF: 'CHF', KRW: '₩', BRL: 'R$', ZAR: 'R', SEK: 'kr', NOK: 'kr', DKK: 'kr',
    SGD: 'S$', HKD: 'HK$', NZD: 'NZ$', MXN: 'MX$', RUB: '₽', TRY: '₺', PLN: 'zł',
    THB: '฿', MYR: 'RM', IDR: 'Rp', PHP: '₱', VND: '₫', BDT: '৳', PKR: '₨',
    EGP: 'E£', NGN: '₦', KES: 'KSh', GHS: 'GH₵', AED: 'د.إ', SAR: '﷼', QAR: 'QR',
    KWD: 'KD', BHD: 'BD', OMR: 'OMR', JOD: 'JD', ILS: '₪', CZK: 'Kč', HUF: 'Ft',
    RON: 'lei', BGN: 'лв', HRK: 'kn', ISK: 'kr', TWD: 'NT$', CLP: 'CL$', COP: 'COL$',
    PEN: 'S/.', ARS: 'AR$', UAH: '₴',
  };
  return map[code] || code + ' ';
}
