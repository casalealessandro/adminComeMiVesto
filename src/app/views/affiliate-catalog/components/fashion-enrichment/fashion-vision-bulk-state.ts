import { FashionVisionBulkJob } from '../../models/affiliate-catalog.models';

/**
 * The backend's terminal status is authoritative. Do not infer completion
 * from scanned counters or from the current category size.
 */
export type VisionBulkPresentation = {
  title: string;
  explanation: string;
  alertKind: 'success' | 'warning' | 'info' | 'secondary';
  finished: boolean;
};

export function visionBulkPresentation(status: FashionVisionBulkJob['status']): VisionBulkPresentation {
  switch (status) {
    case 'SUCCESS':
      return {
        title: 'Analisi completata',
        explanation: 'Scansione della categoria terminata. I risultati HIGH conformi sono stati approvati; gli altri restano esclusi o sospesi.',
        alertKind: 'success', finished: true,
      };
    case 'STOPPED_BUDGET':
      return {
        title: 'Analisi fermata per budget',
        explanation: 'La soglia di spesa ha interrotto il lavoro: la categoria potrebbe non essere stata esplorata interamente.',
        alertKind: 'warning', finished: true,
      };
    case 'FAILED':
      return {
        title: 'Analisi interrotta per errore',
        explanation: 'Il processo non è più in esecuzione e la categoria potrebbe non essere stata completata. Consulta il motivo qui sotto.',
        alertKind: 'warning', finished: true,
      };
    case 'STOPPED':
      return {
        title: 'Analisi arrestata',
        explanation: 'Il job è stato fermato prima della conclusione: la categoria potrebbe non essere stata completata.',
        alertKind: 'warning', finished: true,
      };
    case 'STOP_REQUESTED':
      return {
        title: 'Arresto richiesto',
        explanation: 'Il backend sta completando l\u2019arresto. Una chiamata già iniziata potrebbe terminare.',
        alertKind: 'info', finished: false,
      };
    case 'RUNNING':
      return {
        title: 'Analisi in esecuzione',
        explanation: 'Fashion Vision sta esaminando i prodotti della categoria. Puoi chiudere la pagina: il job continua su Firebase.',
        alertKind: 'info', finished: false,
      };
    case 'QUEUED':
      return {
        title: 'Analisi in coda',
        explanation: 'Il job è stato autorizzato ed è in attesa del worker Firebase.',
        alertKind: 'info', finished: false,
      };
    case 'PREVIEW_READY':
      return {
        title: 'Analisi non ancora avviata',
        explanation: 'È stata preparata soltanto l\u2019anteprima gratuita; le chiamate AI inizieranno solo dopo la tua conferma.',
        alertKind: 'secondary', finished: false,
      };
  }
}

/** A registered RUNNING state is not proof the worker is still making progress. */
export function visionBulkProgressMayBeStale(
  status: FashionVisionBulkJob['status'], updatedAt: number, now: number,
): boolean {
  return ['QUEUED', 'RUNNING', 'STOP_REQUESTED'].includes(status) &&
    Number.isFinite(updatedAt) && updatedAt > 0 && now - updatedAt > 15 * 60_000;
}
