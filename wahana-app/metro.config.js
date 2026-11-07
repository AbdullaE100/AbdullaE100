// Share pure logic (formatting, search model, constants) with the web app so
// the two never drift: ../wahana/lib is watched and importable as @shared/*.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../wahana/lib")];
module.exports = config;
