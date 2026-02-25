const fs = require("fs");
const path = require("path");

function loadCommands(client) {
  const commandsPath = path.join(__dirname, "..", "commands");
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));
    client.commands.set(cmd.data.name, cmd);
  }
}

module.exports = { loadCommands };