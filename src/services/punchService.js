const { getWeekKey } = require("../utils/time");

class PunchService {
  constructor(db) {
    this.db = db;

    this.stmtOpen = db.prepare(`
      SELECT * FROM punches
      WHERE guild_id = ? AND user_id = ? AND end_ts IS NULL
      ORDER BY start_ts DESC
      LIMIT 1
    `);

    this.stmtInsert = db.prepare(`
      INSERT INTO punches (guild_id, user_id, start_ts)
      VALUES (?, ?, ?)
    `);

    this.stmtClose = db.prepare(`
      UPDATE punches
      SET end_ts = ?, duration_ms = ?
      WHERE id = ?
    `);

    this.stmtUpsertWeekly = db.prepare(`
      INSERT INTO weekly_stats (guild_id, week_key, user_id, os_done, service_ms)
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(guild_id, week_key, user_id)
      DO UPDATE SET service_ms = service_ms + excluded.service_ms
    `);
  }

  getOpenPunch(guildId, userId) {
    return this.stmtOpen.get(guildId, userId);
  }

  startPunch(guildId, userId) {
    const open = this.getOpenPunch(guildId, userId);
    if (open) return { ok: false, reason: "Já existe um ponto aberto." };

    const now = Date.now();
    this.stmtInsert.run(guildId, userId, now);
    return { ok: true, startedAt: now };
  }

  endPunch(guildId, userId) {
    const open = this.getOpenPunch(guildId, userId);
    if (!open) return { ok: false, reason: "Você não está em serviço (sem ponto aberto)." };

    const now = Date.now();
    const duration = now - open.start_ts;

    this.stmtClose.run(now, duration, open.id);

    const weekKey = getWeekKey(new Date());
    this.stmtUpsertWeekly.run(guildId, weekKey, userId, duration);

    return { ok: true, durationMs: duration, startedAt: open.start_ts, endedAt: now };
  }
}

module.exports = { PunchService };