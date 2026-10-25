import { visionBulkPresentation, visionBulkProgressMayBeStale } from './fashion-vision-bulk-state';

describe('Fashion Vision full-category status', () => {
  it('marks SUCCESS as finished and clearly completed', () => {
    const result = visionBulkPresentation('SUCCESS');
    expect(result.title).toBe('Analisi completata');
    expect(result.alertKind).toBe('success');
    expect(result.finished).toBeTrue();
  });

  it('does not confuse the budget cap, a failure or a manual stop with a complete category', () => {
    for (const status of ['STOPPED_BUDGET', 'FAILED', 'STOPPED'] as const) {
      const result = visionBulkPresentation(status);
      expect(result.finished).toBeTrue();
      expect(result.alertKind).toBe('warning');
      expect(result.title).not.toBe('Analisi completata');
    }
  });

  it('warns on old active status without wrongly marking the job complete', () => {
    const now = 2_000_000;
    expect(visionBulkProgressMayBeStale('RUNNING', now - 20 * 60_000, now)).toBeTrue();
    expect(visionBulkProgressMayBeStale('RUNNING', now - 2 * 60_000, now)).toBeFalse();
    expect(visionBulkProgressMayBeStale('SUCCESS', now - 20 * 60_000, now)).toBeFalse();
    expect(visionBulkProgressMayBeStale('FAILED', now - 20 * 60_000, now)).toBeFalse();
  });

  it('distinguishes running, queued and pending stops from real completion', () => {
    for (const status of ['RUNNING', 'QUEUED', 'STOP_REQUESTED', 'PREVIEW_READY'] as const) {
      expect(visionBulkPresentation(status).finished).toBeFalse();
      expect(visionBulkPresentation(status).title).not.toBe('Analisi completata');
    }
    expect(visionBulkPresentation('PREVIEW_READY').title).toBe('Analisi non ancora avviata');
  });
});
