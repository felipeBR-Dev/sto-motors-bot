const { stripKnownTags } = require("../utils/nicknames");
const { normalizeText } = require("../utils/text");
const { hierarchy, roleIds } = require("../config");

class TagService {
  constructor(db) {
    this.db = db;

    this.knownTags = hierarchy.map(h => h.tag);

    this.stmtUpsertMember = db.prepare(`
      INSERT INTO members (guild_id, user_id, base_name, last_tag, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(guild_id, user_id)
      DO UPDATE SET base_name = excluded.base_name, last_tag = excluded.last_tag, updated_at = excluded.updated_at
    `);

    this.stmtGetMember = db.prepare(`
      SELECT * FROM members WHERE guild_id = ? AND user_id = ?
    `);

    // Aliases para casar com nomes reais do seu servidor (ajuste se quiser)
    this.roleAliases = {
      CHEFE: ["chefe", "chefe da mecanica", "chefe mecanica"],
      GERENTE: ["gerente"],
      SUPERVISOR: ["supervisor"],
      MECANICO: ["mecanico", "mecânico", "mecanica", "mecânica"],
      APRENDIZ: ["aprendiz"],
      CLIENTE: ["cliente"],
      VISITANTE: ["visitante"]
    };
  }

  resolveTagForMember(member) {
    for (const level of hierarchy) {
      const id = roleIds[level.key];
      if (id && member.roles.cache.has(id)) return level.tag;

      const roleNames = member.roles.cache.map(r => normalizeText(r.name));
      const aliases = (this.roleAliases[level.key] ?? [level.label]).map(a => normalizeText(a));

      const hasAlias = roleNames.some(rn =>
        aliases.some(a => rn === a || rn.includes(a) || a.includes(rn))
      );

      if (hasAlias) return level.tag;
    }
    return null;
  }

  buildDesiredNick({ tag, baseName }) {
    const cleanBase = (baseName ?? "").trim();

    if (!tag) return cleanBase.slice(0, 32);

    const prefix = `${tag} `;
    const maxBase = 32 - prefix.length;
    const safeBase = cleanBase.slice(0, Math.max(0, maxBase));

    return (prefix + safeBase).slice(0, 32);
  }

  async syncNickname(member) {
    if (!member.manageable) {
      return { ok: false, reason: "NOT_MANAGEABLE" };
    }

    const guildId = member.guild.id;
    const userId = member.id;

    const tag = this.resolveTagForMember(member);

    const currentDisplay =
      member.nickname ??
      member.user.globalName ??
      member.user.username;

    const baseName =
      stripKnownTags(currentDisplay, this.knownTags) ||
      (member.user.globalName ?? member.user.username);

    const desiredNick = this.buildDesiredNick({ tag, baseName });

    if ((member.nickname ?? "") === desiredNick) {
      this.stmtUpsertMember.run(guildId, userId, baseName, tag ?? "", Date.now());
      return { ok: true, changed: false, desiredNick, tag };
    }

    try {
      await member.setNickname(desiredNick, "STO Motors: TAG automática por cargo");
      this.stmtUpsertMember.run(guildId, userId, baseName, tag ?? "", Date.now());
      return { ok: true, changed: true, desiredNick, tag };
    } catch (err) {
      return { ok: false, reason: "DISCORD_ERROR", code: err?.code, message: err?.message };
    }
  }

  getMemberState(guildId, userId) {
    return this.stmtGetMember.get(guildId, userId);
  }
}

module.exports = { TagService };