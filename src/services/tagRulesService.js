class TagRulesService {
  constructor(db) {
    this.db = db;

    this.stmtUpsert = db.prepare(`
      INSERT INTO tag_rules (guild_id, role_id, tag, priority, enabled)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(guild_id, role_id)
      DO UPDATE SET tag = excluded.tag, priority = excluded.priority, enabled = excluded.enabled
    `);

    this.stmtList = db.prepare(`
      SELECT role_id, tag, priority, enabled
      FROM tag_rules
      WHERE guild_id = ?
      ORDER BY priority DESC
    `);

    this.stmtDelete = db.prepare(`
      DELETE FROM tag_rules
      WHERE guild_id = ? AND role_id = ?
    `);
  }

  upsertRule(guildId, roleId, tag, priority = 0, enabled = 1) {
    this.stmtUpsert.run(guildId, roleId, tag, priority, enabled);
  }

  listRules(guildId) {
    return this.stmtList.all(guildId);
  }

  deleteRule(guildId, roleId) {
    this.stmtDelete.run(guildId, roleId);
  }
}

module.exports = { TagRulesService };