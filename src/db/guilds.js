const pool = require('./pool');

async function upsertGuild(guild) {
  await pool.query(
    `insert into discord_guild (
       guild_id,
       name,
       owner_id,
       member_count,
       is_active,
       joined_at,
       left_at,
       updated_at
     )
     values ($1, $2, $3, $4, true, now(), null, now())
     on conflict (guild_id) do update
     set name = excluded.name,
         owner_id = excluded.owner_id,
         member_count = excluded.member_count,
         is_active = true,
         left_at = null,
         updated_at = now()`,
    [
      guild.id,
      guild.name,
      guild.ownerId || null,
      typeof guild.memberCount === 'number' ? guild.memberCount : null
    ]
  );
}

async function markGuildInactive(guild) {
  await pool.query(
    `insert into discord_guild (
       guild_id,
       name,
       is_active,
       left_at,
       updated_at
     )
     values ($1, $2, false, now(), now())
     on conflict (guild_id) do update
     set name = excluded.name,
         is_active = false,
         left_at = now(),
         updated_at = now()`,
    [guild.id, guild.name || 'Unknown Guild']
  );
}

module.exports = {
  markGuildInactive,
  upsertGuild
};
