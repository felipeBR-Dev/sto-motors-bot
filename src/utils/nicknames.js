function stripKnownTags(nicknameOrName, knownTags) {
  let text = nicknameOrName ?? "";
  for (const tag of knownTags) {
    if (text.startsWith(tag + " ")) {
      text = text.slice((tag + " ").length);
      break;
    }
    if (text === tag) {
      text = "";
      break;
    }
  }
  return text.trim();
}

module.exports = { stripKnownTags };