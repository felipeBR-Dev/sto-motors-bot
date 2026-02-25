const { EmbedBuilder } = require("discord.js");
const { brand } = require("../config");

function makeEmbed({ title, description, color = brand.colors.chrome, fields = [], footer = true }) {
  const e = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description ?? "");

  if (fields.length) e.addFields(fields);
  if (footer) e.setFooter({ text: brand.name });

  return e;
}

module.exports = { makeEmbed };