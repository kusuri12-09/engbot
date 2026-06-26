const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  requireEnv,
  get discordToken() {
    return requireEnv('DISCORD_TOKEN');
  },
  get discordClientId() {
    return requireEnv('DISCORD_CLIENT_ID');
  },
  get databaseUrl() {
    return requireEnv('DATABASE_URL');
  }
};
