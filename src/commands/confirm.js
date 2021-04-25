'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const logger = require('../logger');
const ctx = require('../context');

module.exports = async function (_, message) {
    let user = ctx.UsersPending[message.author.id];

    if (!user) {
        logger().info('invalid user, author: %s', message.author.id)
        return message.reply('Не могу найти вас в списках. Вы уже запросили свой секретный ключ? Используйте \`verify %Ваш BYOND-аккаунт%\`.');
    }

    if (isValidSecret(user, await fetchByondMemeber(user))) {
        return verifyUser(message, user);
    } else {
        return message.reply('Не могу подтвердить аккаунт! Проверьте ваш код и что он размещен в Shoutbox вашего профиля.');
    }
}

function isValidSecret(user, data) {
    const $ = cheerio.load(data);

    // shitty part because byond site is not parsable
    let comments = $('.shoutbox_comment');

    if (!comments.length) {
        return false;
    }

    let success = false;

    comments.each((_, el) => {
        let comment = $(el);

        if (ctx.ckey($('.shoutbox_comment_header a:not(.shoutbox_comment_icon)', comment).text()) === user.ckeyByond) {
            let msgSecret = comment.text().replace(/\s\s+/g, ' ').trim().split(" ").slice(-1)[0]; // fun
            if (msgSecret === user.secret) {
                success = true;
                return;
            }
        }
    });

    return success;
}

async function fetchByondMemeber(user) {
    let url = `http://www.byond.com/members/${user.ckeyByond}`;
    let response = await axios.get(url);
    if (response.status !== 200) {
        throw `unable to get ${url}`;
    }
    return response.data
}

async function verifyUser(message, user) {
    try {
        let guild = ctx.Discord.guilds.cache.get(ctx.DiscrodGuildId);
        let role = guild.roles.cache.find(role => role.name === ctx.VerifiedGroup);
        let member = guild.members.cache.get(user.uid);
        await member.setNickname(user.ckeyByond);
        await member.roles.add(role);
    } catch (e) {
        logger().error({ message: 'unable to verify user', user: user }, e);
        return message.reply("Не могу подтвердить аккаунт! Возможно, вы имеете больше прав.");
    }

    // No need to store user info.
    delete ctx.UsersPending[user.uid];
    
    logger().info({
        message: 'user verified',
        user: user,
    })

    return message.reply(`Аккаунт **${user.ckeyByond}** верифицирован. Добро пожаловать!`);
}
