const pool = require('./pool');

async function upsertUserInstall({
  userId,
  username,
  globalName,
  context,
  guildId,
  channelId
}) {
  await pool.query(
    `insert into discord_user (
       user_id,
       username,
       global_name,
       last_context,
       last_guild_id,
       last_channel_id,
       first_seen_at,
       last_seen_at
     )
     values ($1, $2, $3, $4, $5, $6, now(), now())
     on conflict (user_id) do update
     set username = excluded.username,
         global_name = excluded.global_name,
         last_context = excluded.last_context,
         last_guild_id = excluded.last_guild_id,
         last_channel_id = excluded.last_channel_id,
         last_seen_at = now()`,
    [
      userId,
      username,
      globalName || null,
      context || null,
      guildId || null,
      channelId || null
    ]
  );
}

module.exports = {
  upsertUserInstall
};
