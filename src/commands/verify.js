'use strict';

const logger = require('../logger');
const ctx = require('../context');

module.exports = function (args, message) {
    let byond = args.join(' '); // formatted nickname
    let ckeyByond = ctx.ckey(byond);
    let uid = message.author.id;

    if (!ckeyByond) {
        logger().info({
            message: 'unknown user',
            ckeyByond: ckeyByond,
            uid: uid,
        });
        return message.reply('Проверьте правильность указаного никнейма :face_with_monocle:');
    }

    let secret = Math.random().toString(36).substring(7);
    let byondPofile = "http://www.byond.com/members/" + ckeyByond;

    let pmMessage = `
    Доброго дня! Вы указали аккаунт: **${byond}**, ваш секретный ключ: **${secret}**.
    Разместите его в Shoutbox (комментариях) в вашем профиле BYOND: ${byondPofile}.
    После этого используйте команду \`confirm\`.`.trimIndent();

    ctx.UsersPending[uid] = {
        uid: uid,
        byond: byond,
        secret: secret,
        ckeyByond: ckeyByond,
    };

    logger().info({
        message: 'pending user',
        user: ctx.UsersPending[uid],
    });

    return message.reply(pmMessage);
}
