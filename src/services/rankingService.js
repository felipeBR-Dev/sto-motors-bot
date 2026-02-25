class RankingService {
  constructor(db) {
    this.db = db;

    this.stmtTopOS = db.prepare(`
      SELECT user_id, os_done
      FROM weekly_stats
      WHERE guild_id = ? AND week_key = ?
      ORDER BY os_done DESC, user_id ASC
      LIMIT ?
    `);

    this.stmtTopHours = db.prepare(`
      SELECT user_id, service_ms
      FROM weekly_stats
      WHERE guild_id = ? AND week_key = ?
      ORDER BY service_ms DESC, user_id ASC
      LIMIT ?
    `);

    this.stmtResetWeek = db.prepare(`
      DELETE FROM weekly_stats
      WHERE guild_id = ? AND week_key = ?
    `);
  }

  topOS(guildId, weekKey, limit = 10) {
    return this.stmtTopOS.all(guildId, weekKey, limit);
  }

  topHours(guildId, weekKey, limit = 10) {
    return this.stmtTopHours.all(guildId, weekKey, limit);
  }

  resetWeek(guildId, weekKey) {
    this.stmtResetWeek.run(guildId, weekKey);
  }
}

module.exports = { RankingService };