const { SlashCommandBuilder } = require("discord.js");
const { makeEmbed } = require("../utils/embeds");
const { brand } = require("../config");
const { formatDuration, getWeekKey } = require("../utils/time");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Mostra rankings semanais.")
    .addStringOption(opt =>
      opt.setName("tipo")
        .setDescription("OS concluídas ou horas")
        .setRequired(true)
        .addChoices(
          { name: "OS Concluídas", value: "os" },
          { name: "Horas em Serviço", value: "hours" }
        )
    ),

  async execute(client, interaction) {
    const tipo = interaction.options.getString("tipo");
    const weekKey = getWeekKey(new Date());
    const guildId = interaction.guildId;

    if (tipo === "os") {
      const top = client.rankingService.topOS(guildId, weekKey, 10);
      const desc = top.length
        ? top.map((r, i) => `**${i + 1}.** <@${r.user_id}> — **${r.os_done}** OS`).join("\n")
        : "Sem dados nesta semana ainda.";

      return interaction.reply({
        embeds: [makeEmbed({ title: `Ranking Semanal • OS (${weekKey})`, description: desc, color: brand.colors.chrome })]
      });
    }

    const top = client.rankingService.topHours(guildId, weekKey, 10);
    const desc = top.length
      ? top.map((r, i) => `**${i + 1}.** <@${r.user_id}> — **${formatDuration(r.service_ms)}**`).join("\n")
      : "Sem dados nesta semana ainda.";

    return interaction.reply({
      embeds: [makeEmbed({ title: `Ranking Semanal • Horas (${weekKey})`, description: desc, color: brand.colors.chrome })]
    });
  }
};