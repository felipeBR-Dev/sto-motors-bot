const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { makeEmbed } = require("../utils/embeds");
const { brand } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tag")
    .setDescription("Gerencia regras de TAG por cargo (admin).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    // /tag add cargo:@Role tag:"[Candidato]" prioridade:10
    .addSubcommand(sc =>
      sc.setName("add")
        .setDescription("Adiciona/atualiza uma regra: cargo -> tag.")
        .addRoleOption(o => o.setName("cargo").setDescription("Cargo que dispara a TAG").setRequired(true))
        .addStringOption(o => o.setName("tag").setDescription('Texto da TAG (ex: "[Candidato]")').setRequired(true))
        .addIntegerOption(o => o.setName("prioridade").setDescription("Maior = mais importante").setRequired(false))
    )

    // /tag remove cargo:@Role
    .addSubcommand(sc =>
      sc.setName("remove")
        .setDescription("Remove a regra de TAG desse cargo.")
        .addRoleOption(o => o.setName("cargo").setDescription("Cargo").setRequired(true))
    )

    // /tag list
    .addSubcommand(sc =>
      sc.setName("list")
        .setDescription("Lista as regras de TAG configuradas.")
    ),

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === "add") {
      const role = interaction.options.getRole("cargo");
      const tag = interaction.options.getString("tag");
      const prioridade = interaction.options.getInteger("prioridade") ?? 0;

      // validação simples para você não se cortar depois
      if (!tag.startsWith("[") || !tag.endsWith("]")) {
        return interaction.reply({
          embeds: [makeEmbed({
            title: "TAG inválida",
            description: 'Use o formato com colchetes, ex: **"[Candidato]"**',
            color: brand.colors.black
          })],
          ephemeral: true
        });
      }

      client.tagRulesService.upsertRule(guildId, role.id, tag, prioridade, 1);

      return interaction.reply({
        embeds: [makeEmbed({
          title: "Regra salva ✅",
          description: `Cargo: <@&${role.id}>\nTAG: **${tag}**\nPrioridade: **${prioridade}**`,
          color: brand.colors.blue
        })],
        ephemeral: true
      });
    }

    if (sub === "remove") {
      const role = interaction.options.getRole("cargo");
      client.tagRulesService.deleteRule(guildId, role.id);

      return interaction.reply({
        embeds: [makeEmbed({
          title: "Regra removida ✅",
          description: `Cargo: <@&${role.id}>`,
          color: brand.colors.chrome
        })],
        ephemeral: true
      });
    }

    // list
    const rules = client.tagRulesService.listRules(guildId);

    const desc = rules.length
      ? rules.map(r =>
          `• <@&${r.role_id}> → **${r.tag}** (prioridade: **${r.priority}**, enabled: **${r.enabled}**)`
        ).join("\n")
      : "Nenhuma regra cadastrada ainda. Use `/tag add`.";

    return interaction.reply({
      embeds: [makeEmbed({
        title: "Regras de TAG (por cargo)",
        description: desc,
        color: brand.colors.chrome
      })],
      ephemeral: true
    });
  }
};