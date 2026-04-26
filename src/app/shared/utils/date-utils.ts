export function calculatePreviousPeriod(
  fechaIni: string,
  fechaFin: string
): { fechaIniPrev: string; fechaFinPrev: string } {

  const ini = new Date(fechaIni);
  const fin = new Date(fechaFin);

  // diferencia en días (inclusive)
  const diffDays =
    Math.round(
      (fin.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  // periodo anterior termina un día antes del inicio actual
  const prevFin = new Date(ini);
  prevFin.setDate(prevFin.getDate() - 1);

  const prevIni = new Date(prevFin);
  prevIni.setDate(prevIni.getDate() - diffDays + 1);

  return {
    fechaIniPrev: prevIni.toISOString().slice(0, 10),
    fechaFinPrev: prevFin.toISOString().slice(0, 10)
  };
}


export function getDateRangeDays(fechaIni: string, fechaFin: string): number {
  const start = new Date(fechaIni);
  const end = new Date(fechaFin);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
