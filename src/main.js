'use strict';

const Discord = require('discord.js');

const logger = require('./logger');
const ctx = require('./context');

const commandHelp = require('./commands/help');
const commandVerify = require('./commands/verify');
const commandConfirm = require('./commands/confirm');

const commands = {
    'help': commandHelp,
    'info': commandHelp,
    'verify': commandVerify,
    'confirm': commandConfirm,
};

module.exports = function () {
    logger().info('creating discord client...');
    ctx.Discord = new Discord.Client();

    logger().info('setting up discord callbacks...');
    ctx.Discord.on('ready', onReady);
    ctx.Discord.on('message', onMessage);

    ctx.Discord.login(ctx.DiscordToken);
};

async function onReady() {
    logger().info('discord ready!');
}

async function onMessage(message) {
    if (!message.author.id || message.author.bot || message.channel.type !== 'dm') {
        return;
    }

    logger().info({
        message: 'new message',
        userName: message.author.username,
        userId: message.author.id,
        content: message.content,
    });

    if (isUserTimeout(message.author.id)) {
        logger().info({
            message: 'user timeout',
            userName: message.author.username,
            userId: message.author.id,
        });

        return message.reply('Слишком много вопросов, повторите позже :neutral_face:');
    }

    // Clear old users per request.
    clearStaledTimeouts();

    let command = message.content.toLowerCase().split(" ")[0];
    let args = message.content.split(" ").slice(1);
    let action = commands[command];

    try {
        if (action) {
            return action(args, message);
        } else {
            return message.reply(`Неизвестная команда :confused:`);
        }
    } catch (e) {
        logger().error('unknown error', e);
        return message.reply('Что-то пошло не так, повторите позже :pensive:')
    }
}

function isTimeout(currTime, lastRequest) {
    const requestDelay = 1000; // 1 sec
    return lastRequest + requestDelay > currTime;
}

function isUserTimeout(userId) {
    let lastRequest = ctx.UsersTimeouts[userId] || 0;
    let currTime = new Date().getTime();
    ctx.UsersTimeouts[userId] = currTime;
    return isTimeout(currTime, lastRequest);
}

function clearStaledTimeouts() {
    let currTime = new Date().getTime();

    for (const [userId, lastRequest] of Object.entries(ctx.UsersTimeouts)) {
        if (!isTimeout(currTime, lastRequest)) {
            delete ctx.UsersTimeouts[userId];
        }
    }
}
