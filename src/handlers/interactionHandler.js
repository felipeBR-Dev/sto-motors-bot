const { logger } = require("../utils/logger");

/**
 * Handler central de interações:
 * - Slash commands
 * - Buttons
 * - Select menus
 * - Modals
 */
async function handleInteraction(client, interaction) {
  try {
    // Slash command
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      await cmd.execute(client, interaction);
      return;
    }

    // Buttons / Select / Modal
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
      // Encaminha para um “router” simples baseado em customId
      await client.router.route(client, interaction);
      return;
    }
  } catch (err) {
    logger.error(`Interaction error: ${err?.stack || err}`);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: "❌ Ocorreu um erro ao processar sua ação.", ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: "❌ Ocorreu um erro ao processar sua ação.", ephemeral: true }).catch(() => {});
    }
  }
}

module.exports = { handleInteraction };