'use strict';

const logger = require('./src/logger');
const main = require('./src/main');
const ctx = require('./src/context');

const discordToken = process.env.DISCORD_TOKEN;
const discordGuildId = process.env.DISCORD_GUILD_ID;
const logsPath = process.env.LOGS_PATH || 'logs/hop.log';
const verifiedGroup = process.env.VERIFIED_GROUP || 'Verified Byond';

verifyEnv('discordToken', discordToken);
verifyEnv('discordGuildId', discordGuildId);
verifyEnv('logsPath', logsPath);
verifyEnv('verifiedGroup', verifiedGroup)

ctx.DiscrodGuildId = discordGuildId;
ctx.DiscordToken = discordToken;
ctx.VerifiedGroup = verifiedGroup;

logger(logsPath);
main();

function verifyEnv(varName, envVar) {
    if (!envVar) {
        console.error(`unable to find '${varName}', ensure you have configured environment properly`);
        process.exit(-1);
    }
}

Object.assign(String.prototype, {
    trimIndent() {
        return this.replace(/(\n)\s+/g, '$1');
    }
});
