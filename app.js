"use strict";

const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Discord.Client();

const discordToken = process.env.DISCORD_TOKEN;
const verifiedGroup = process.env.VERIFIED_GROUP;
const mainChannelID = process.env.MAIN_CHANNEL_ID;
let mainChannel = '';

const pendingList = [];

const getRequestDelay = 1000;//1 sec
let lastGetRequest = new Date().getTime() - getRequestDelay;

client.on('ready', () => {
    if (mainChannelID.length) {
        mainChannel = client.channels.cache.get(mainChannelID);
        //mainChannel.send('HoP in the office!');
    };
});

client.on('message', async message => {

    if (message.author.bot || message.channel.type === 'dm' || message.content[0] !== ".") {
        return;
    };

    if (!(mainChannelID.length && message.channel.id === mainChannelID)) {
        return;
    };

    let command = message.content.toLowerCase().split(" ")[0];
    let args = message.content.split(" ").slice(1);

    /*	if (command === '.ping') {
            return message.reply('pong');
        };*/

    if (command === '.help' || command === '.info') {
        return message.reply('Используйте \`\`.verify %Ваш Byond аккаунт%\`\` для верификации: вы будете переименованны в соответствии с вашим Byond-аккаунтом и получите плашку. Необходимо разрешить получение личных сообщений с этого дискорд сервера!');
    };

    if (command === ".verify") {
        let byond = args.join(" ");//formatted nickname
        let ckeyByond = ckey(byond);
        let uid = message.author.id;

        if (!ckeyByond || !uid) {
            return;
        };

        let client = message.guild.members.cache.get(uid);
        let secret = Math.random().toString(36).substring(7);
        let byondPofile = "http://www.byond.com/members/" + ckeyByond;

        let pmMessage = `Доброго дня! Вы указали аккаунт: **${byond}**, ваш секретный ключ: **${secret}**\n`
        pmMessage += `Разместите его в Shoutbox (комментариях) в вашем профиле Byond: ${byondPofile} (вы можете удалить этот комментарий после успешной верификации)\n`
        pmMessage += `После этого вернитесь в наш канал **#${mainChannel.name}** и используйте команду \`\`.confirm\`\``;

        //check if we alredy have this account in cache
        let entry = pendingList.filter(entry => entry.uid === uid)[0];
        if (entry) {
            entry.byond = byond;
            entry.secret = secret;
            entry.ckeyByond = ckeyByond;
        } else {
            pendingList.push({ uid: uid, byond: byond, secret: secret, ckeyByond: ckeyByond });
        };

        return message.author.send(pmMessage);
    };

    if (command === ".confirm") {
        let uid = message.author.id;

        if (!uid) {
            return;
        };

        let client = message.guild.members.cache.get(uid);
        let entry = pendingList.filter(entry => entry.uid === uid)[0];
        if (!entry) {
            return message.reply('Не могу найти вас в списках. Вы уже запросили свой секретный ключ? Используйте \`\`.verify %Ваш Byond аккаунт%\`\`. Необходимо разрешить получение личных сообщений с этого дискорд сервера!');
        };

        let curTime = new Date().getTime();
        if (lastGetRequest + getRequestDelay > curTime) {
            return message.reply('Много запросов, повторите позже.');
        } else {
            lastGetRequest = curTime;
        };

        let response;
        try {
            response = await axios.get('http://www.byond.com/members/' + entry.ckeyByond);
            if (response.status !== 200) {
                throw "Site problem";
            };
        } catch (error) {
            return message.reply('Что-то сломалось! Повторите позже.');
        };

        try {
            const $ = cheerio.load(response.data);
            let success = false;
            //shitty part because byond site is not parsable
            let comments = $('.shoutbox_comment');
            if (!comments.length) {
                throw "Wrong byond profile";
            };
            comments.each((index, el) => {
                let comment = $(el);
                if (ckey($('.shoutbox_comment_header a:not(.shoutbox_comment_icon)', comment).text()) === entry.ckeyByond) {
                    let msgSecret = comment.text().replace(/\s\s+/g, ' ').trim().split(" ").slice(-1)[0];//fun
                    if (msgSecret === entry.secret) {
                        success = true;
                        return false;
                    };
                };

            });

            if (!success) {
                throw "Secret not found";
            };

        } catch (error) {
            console.log(error);
            return message.reply('Не могу подтвердить аккаунт! Проверьте ваш код и что он размещен в Shoutbox вашего профиля. Позовите администратора, если ошибка повторяется.');
        };

        try {
            await client.guild.members.cache.get(uid).setNickname(entry.byond);
            let role = await message.guild.roles.cache.find(role => role.name === verifiedGroup);
            await client.guild.members.cache.get(uid).roles.add(role);
        } catch (error) {
            console.log(error);
            return message.reply("Не могу подтвердить аккаунт! Возможно, вы имеете больше прав.");
        };

        return message.reply(`Аккаунт ${entry.byond} верифицирован, добро пожаловать!`);
    };
});

function ckey(name) {
    return name.replace(/[ .]/g, '').toLowerCase();
}

client.login(discordToken);
