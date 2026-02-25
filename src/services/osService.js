const { getWeekKey } = require("../utils/time");

class OSService {
  constructor(db) {
    this.db = db;

    this.stmtCreate = db.prepare(`
      INSERT INTO work_orders (guild_id, created_by, assigned_to, cliente, veiculo, servicos, valor, status, created_ts)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `);

    this.stmtGet = db.prepare(`SELECT * FROM work_orders WHERE guild_id = ? AND id = ?`);

    this.stmtCloseDone = db.prepare(`
      UPDATE work_orders
      SET status = 'DONE', closed_ts = ?
      WHERE guild_id = ? AND id = ? AND status = 'OPEN'
    `);

    this.stmtUpsertWeeklyOS = db.prepare(`
      INSERT INTO weekly_stats (guild_id, week_key, user_id, os_done, service_ms)
      VALUES (?, ?, ?, 1, 0)
      ON CONFLICT(guild_id, week_key, user_id)
      DO UPDATE SET os_done = os_done + 1
    `);
  }

  createOS({ guildId, createdBy, assignedTo, cliente, veiculo, servicos, valor }) {
    const now = Date.now();
    const info = this.stmtCreate.run(guildId, createdBy, assignedTo, cliente, veiculo, servicos, valor, now);
    return { id: info.lastInsertRowid, createdTs: now };
  }

  getOS(guildId, id) {
    return this.stmtGet.get(guildId, id);
  }

  closeOSDone(guildId, id) {
    const now = Date.now();
    const result = this.stmtCloseDone.run(now, guildId, id);

    if (result.changes === 0) {
      return { ok: false, reason: "OS não encontrada ou já foi finalizada/cancelada." };
    }

    const os = this.getOS(guildId, id);
    const weekKey = getWeekKey(new Date());
    this.stmtUpsertWeeklyOS.run(guildId, weekKey, os.assigned_to);

    return { ok: true, closedTs: now, os };
  }
}

module.exports = { OSService };