require("dotenv").config();

const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const { initDatabase } = require("./db/database");
const { loadCommands } = require("./handlers/commandHandler");
const { handleInteraction } = require("./handlers/interactionHandler");

const { PunchService } = require("./services/punchService");
const { OSService } = require("./services/osService");
const { RankingService } = require("./services/rankingService");
const { TagService } = require("./services/tagService");

const { scheduleWeeklyReset } = require("./jobs/weeklyReset");
const { KeyedQueue } = require("./utils/queue");
const { logger } = require("./utils/logger");
const { makeEmbed } = require("./utils/embeds");
const { brand } = require("./config");
const { formatDuration, getWeekKey } = require("./utils/time");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "";

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Faltam variáveis .env: DISCORD_TOKEN, CLIENT_ID, GUILD_ID");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember]
});

// ✅ obrigatório
client.commands = new Collection();

// ✅ fila para evitar conflitos ao alterar nick
client.tagQueue = new KeyedQueue();

// DB + Services
const db = initDatabase();
client.punchService = new PunchService(db);
client.osService = new OSService(db);
client.rankingService = new RankingService(db);
client.tagService = new TagService(db);

// Router (Buttons/Select/Modal)
client.router = {
  async route(client, interaction) {
    // BOTÕES
    if (interaction.isButton()) {
      if (interaction.customId === "panel:punch_in") {
        const r = client.punchService.startPunch(interaction.guildId, interaction.user.id);
        if (!r.ok) {
          return interaction.reply({ embeds: [makeEmbed({ title: "Ponto", description: `⚠️ ${r.reason}`, color: brand.colors.black })], ephemeral: true });
        }
        return interaction.reply({ embeds: [makeEmbed({ title: "Ponto aberto ✅", description: "Você entrou em serviço.", color: brand.colors.blue })], ephemeral: true });
      }

      if (interaction.customId === "panel:punch_out") {
        const r = client.punchService.endPunch(interaction.guildId, interaction.user.id);
        if (!r.ok) {
          return interaction.reply({ embeds: [makeEmbed({ title: "Ponto", description: `⚠️ ${r.reason}`, color: brand.colors.black })], ephemeral: true });
        }
        return interaction.reply({
          embeds: [makeEmbed({ title: "Ponto fechado ✅", description: `Tempo: **${formatDuration(r.durationMs)}**`, color: brand.colors.chrome })],
          ephemeral: true
        });
      }

      if (interaction.customId === "panel:open_os") {
        return client.router.openOSModal(interaction);
      }

      if (interaction.customId.startsWith("os:done:")) {
        const id = Number(interaction.customId.split(":").pop());
        const r = client.osService.closeOSDone(interaction.guildId, id);
        if (!r.ok) {
          return interaction.reply({ embeds: [makeEmbed({ title: "OS", description: `⚠️ ${r.reason}`, color: brand.colors.black })], ephemeral: true });
        }
        return interaction.reply({
          embeds: [makeEmbed({ title: `OS #${id} finalizada ✅`, description: `Responsável: <@${r.os.assigned_to}>`, color: brand.colors.blue })]
        });
      }
    }

    // SELECT MENU
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "panel:menu") {
        const value = interaction.values[0];
        const weekKey = getWeekKey(new Date());

        if (value === "rank_os") {
          const top = client.rankingService.topOS(interaction.guildId, weekKey, 10);
          const desc = top.length
            ? top.map((r, i) => `**${i + 1}.** <@${r.user_id}> — **${r.os_done}** OS`).join("\n")
            : "Sem dados nesta semana ainda.";

          return interaction.reply({
            embeds: [makeEmbed({ title: `Ranking Semanal • OS (${weekKey})`, description: desc, color: brand.colors.chrome })],
            ephemeral: true
          });
        }

        if (value === "rank_hours") {
          const top = client.rankingService.topHours(interaction.guildId, weekKey, 10);
          const desc = top.length
            ? top.map((r, i) => `**${i + 1}.** <@${r.user_id}> — **${formatDuration(r.service_ms)}**`).join("\n")
            : "Sem dados nesta semana ainda.";

          return interaction.reply({
            embeds: [makeEmbed({ title: `Ranking Semanal • Horas (${weekKey})`, description: desc, color: brand.colors.chrome })],
            ephemeral: true
          });
        }

        if (value === "admin_sync_tags") {
          if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: "❌ Apenas Administradores podem usar esta ação.", ephemeral: true });
          }

          await interaction.reply({ content: "🔄 Sincronizando TAGs…", ephemeral: true });

          let ok = 0, fail = 0;
          const failures = [];

          const members = await interaction.guild.members.fetch();
          for (const m of members.values()) {
            const r = await client.tagService.syncNickname(m).catch((e) => ({
              ok: false, reason: "CRASH", message: e?.message
            }));

            if (r?.ok) ok++;
            else {
              fail++;
              failures.push({ user: `${m.user.username} (${m.id})`, reason: r?.reason, code: r?.code, message: r?.message });
            }
          }

          const preview = failures.slice(0, 8).map(f => {
            const code = f.code ? ` code=${f.code}` : "";
            const msg = f.message ? ` | ${String(f.message).slice(0, 80)}` : "";
            return `- ${f.user}: ${f.reason}${code}${msg}`;
          }).join("\n");

          const text =
            `✅ TAGs sincronizadas.\nSucesso: **${ok}** | Falhas: **${fail}**` +
            (failures.length ? `\n\n**Falhas (amostra):**\n${preview}` : "");

          return interaction.editReply({ content: text });
        }
      }
    }

    // MODAL SUBMIT
    if (interaction.isModalSubmit()) {
      if (interaction.customId === "modal:os:create") {
        const cliente = interaction.fields.getTextInputValue("os:cliente");
        const veiculo = interaction.fields.getTextInputValue("os:veiculo");
        const servicos = interaction.fields.getTextInputValue("os:servicos");
        const valorStr = interaction.fields.getTextInputValue("os:valor").replace(",", ".");
        const valor = Number(valorStr);

        if (!Number.isFinite(valor) || valor < 0) {
          return interaction.reply({ content: "⚠️ Valor inválido. Use números (ex: 250.00).", ephemeral: true });
        }

        const assignedTo = interaction.user.id;

        const created = client.osService.createOS({
          guildId: interaction.guildId,
          createdBy: interaction.user.id,
          assignedTo,
          cliente,
          veiculo,
          servicos,
          valor
        });

        const doneRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`os:done:${created.id}`).setLabel("Marcar como Concluída").setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
          embeds: [
            makeEmbed({
              title: `OS #${created.id} aberta 🧾`,
              description: "Ordem de Serviço criada com sucesso.",
              color: brand.colors.chrome,
              fields: [
                { name: "Responsável", value: `<@${assignedTo}>`, inline: true },
                { name: "Cliente", value: cliente, inline: true },
                { name: "Veículo", value: veiculo, inline: true },
                { name: "Serviços", value: servicos, inline: false },
                { name: "Valor", value: `R$ ${valor.toFixed(2)}`, inline: true }
              ]
            })
          ],
          components: [doneRow]
        });
      }
    }
  },

  async openOSModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("modal:os:create")
      .setTitle("Abrir Ordem de Serviço (OS)");

    const cliente = new TextInputBuilder().setCustomId("os:cliente").setLabel("Cliente").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80);
    const veiculo = new TextInputBuilder().setCustomId("os:veiculo").setLabel("Veículo").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80);
    const servicos = new TextInputBuilder().setCustomId("os:servicos").setLabel("Serviços Realizados").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000);
    const valor = new TextInputBuilder().setCustomId("os:valor").setLabel("Valor (ex: 250.00)").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);

    modal.addComponents(
      new ActionRowBuilder().addComponents(cliente),
      new ActionRowBuilder().addComponents(veiculo),
      new ActionRowBuilder().addComponents(servicos),
      new ActionRowBuilder().addComponents(valor)
    );

    await interaction.showModal(modal);
  }
};

// Load commands
loadCommands(client);

client.once("ready", async () => {
  logger.info(`Logado como ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const commandsJSON = client.commands.map(c => c.data.toJSON());
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commandsJSON });

  logger.info(`Comandos registrados no servidor ${GUILD_ID}`);

  scheduleWeeklyReset({ client, rankingService: client.rankingService });

  if (LOG_CHANNEL_ID) {
    const ch = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (ch) ch.send({ embeds: [makeEmbed({ title: "Bot Online ✅", description: "STO Motors iniciado com sucesso.", color: brand.colors.blue })] }).catch(() => {});
  }
});

client.on("interactionCreate", (interaction) => handleInteraction(client, interaction));

/**
 * ✅ TAG AUTOMÁTICA:
 * Sempre que um cargo for dado/removido, recalcula a tag pela hierarquia
 * e atualiza o nickname.
 */
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());

    let changed = false;
    for (const id of oldRoles) if (!newRoles.has(id)) { changed = true; break; }
    if (!changed) for (const id of newRoles) if (!oldRoles.has(id)) { changed = true; break; }

    if (!changed) return;

    await client.tagQueue.add(newMember.id, async () => {
      const r = await client.tagService.syncNickname(newMember);
      if (!r.ok) logger.warn(`Falha TAG: ${newMember.user.username} reason=${r.reason} code=${r.code ?? ""}`);
    });
  } catch (e) {
    logger.error(`guildMemberUpdate error: ${e?.stack || e}`);
  }
});

client.login(TOKEN);