const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { makeEmbed } = require("../utils/embeds");
const { brand } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-panel")
    .setDescription("Cria o painel administrativo STO Motors.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const embed = makeEmbed({
      title: "Painel STO Motors",
      description:
        "Use os botões para **Ponto** e **OS**.\n" +
        "Use o menu para **Rankings** e **Admin**.",
      color: brand.colors.chrome
    });

    const rowButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("panel:punch_in").setLabel("Bater Ponto").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("panel:punch_out").setLabel("Sair do Ponto").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("panel:open_os").setLabel("Abrir OS").setStyle(ButtonStyle.Success)
    );

    const rowSelect = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("panel:menu")
        .setPlaceholder("Selecione uma opção…")
        .addOptions(
          { label: "Ranking Semanal (OS)", value: "rank_os", description: "Top por OS concluídas na semana" },
          { label: "Ranking Semanal (Horas)", value: "rank_hours", description: "Top por horas em serviço na semana" },
          { label: "Admin: Sincronizar TAGs", value: "admin_sync_tags", description: "Reaplica TAGs nos membros (Admin)" }
        )
    );

    await interaction.reply({ embeds: [embed], components: [rowButtons, rowSelect] });
  }
};