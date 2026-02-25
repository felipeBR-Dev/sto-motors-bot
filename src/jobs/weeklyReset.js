const cron = require("node-cron");
const { getWeekKey } = require("../utils/time");
const { logger } = require("../utils/logger");

function scheduleWeeklyReset({ client, rankingService }) {
  // Segunda-feira 00:05 (TZ do .env)
  cron.schedule("5 0 * * 1", async () => {
    try {
      const now = new Date();
      const prev = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const prevKey = getWeekKey(prev);
      const currentKey = getWeekKey(now);

      for (const guild of client.guilds.cache.values()) {
        rankingService.resetWeek(guild.id, prevKey);
      }

      logger.info(`Reset semanal: limpou ${prevKey}. Semana atual: ${currentKey}`);
    } catch (e) {
      logger.error(`Erro no reset semanal: ${e?.stack || e}`);
    }
  });
}

module.exports = { scheduleWeeklyReset };