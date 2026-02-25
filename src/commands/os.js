const { SlashCommandBuilder } = require("discord.js");
const { makeEmbed } = require("../utils/embeds");
const { formatDuration } = require("../utils/time");
const { brand } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ponto")
    .setDescription("Gerencia seu ponto.")
    .addStringOption(opt =>
      opt.setName("acao")
        .setDescription("Escolha bater ou sair do ponto")
        .setRequired(true)
        .addChoices(
          { name: "Bater Ponto", value: "in" },
          { name: "Sair do Ponto", value: "out" }
        )
    ),

  async execute(client, interaction) {
    const action = interaction.options.getString("acao");
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    if (action === "in") {
      const r = client.punchService.startPunch(guildId, userId);
      if (!r.ok) {
        return interaction.reply({
          embeds: [makeEmbed({ title: "Ponto", description: `⚠️ ${r.reason}`, color: brand.colors.black })],
          ephemeral: true
        });
      }

      return interaction.reply({
        embeds: [makeEmbed({ title: "Ponto aberto ✅", description: "Você entrou em serviço agora.", color: brand.colors.blue })],
        ephemeral: true
      });
    }

    const r = client.punchService.endPunch(guildId, userId);
    if (!r.ok) {
      return interaction.reply({
        embeds: [makeEmbed({ title: "Ponto", description: `⚠️ ${r.reason}`, color: brand.colors.black })],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [makeEmbed({ title: "Ponto fechado ✅", description: `Tempo: **${formatDuration(r.durationMs)}**`, color: brand.colors.chrome })],
      ephemeral: true
    });
  }
};