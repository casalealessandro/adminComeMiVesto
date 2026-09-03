import { buildReportUpdate } from './report.service';
describe('buildReportUpdate', () => {
  it('builds the exact pending DTO', () => expect(buildReportUpdate('pending', 'other')).toEqual({ status: 'pending' }));
  it('builds a resolved DTO with resolution', () => expect(buildReportUpdate('resolved', 'content_removed')).toEqual({ status: 'resolved', resolution: 'content_removed' }));
  it('forces no_violation for dismissed', () => expect(buildReportUpdate('dismissed', 'other')).toEqual({ status: 'dismissed', resolution: 'no_violation' }));
  it('rejects resolved without resolution', () => expect(() => buildReportUpdate('resolved')).toThrow());
});
