import { ReseñaModel } from './database.js';
export async function assignUserLevel(client, guildId, userId) {
  const guild  = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(userId);
  const count  = await ReseñaModel.countDocuments({ autorDiscord: userId, isDeleted: false });

  const tiers = [
    { name: 'Otakin',  threshold: 30 },
    { name: 'Guatón',  threshold: 20 },
    { name: 'Regalón', threshold: 10 }
  ];

  const newTier = tiers.find((t) => count >= t.threshold);

  for (const { name } of tiers) {
    const role = guild.roles.cache.find((r) => r.name === name);
    if (!role) continue;
    if (newTier && newTier.name === name) {
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }
    } else {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
      }
    }
  }
}
