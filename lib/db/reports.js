/**
 * lib/db/reports.js — moderatsiya shikoyatlari bilan ishlash uchun SQL qatlami.
 */

function createReport(db, report) {
  db.prepare(`INSERT INTO reports (
    id, reporter, type, target_id, target_title, target_owner, reason, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    report.id, report.reporter, report.type, report.targetId,
    report.targetTitle ?? null, report.targetOwner ?? null, report.reason ?? null,
    report.status || 'open', report.createdAt || new Date().toISOString()
  );
}

function resolveReport(db, id, resolvedBy) {
  db.prepare('UPDATE reports SET status = ?, resolved_by = ?, resolved_at = ? WHERE id = ?')
    .run('resolved', resolvedBy, new Date().toISOString(), id);
}

module.exports = { createReport, resolveReport };
