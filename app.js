"use strict";

const Discord = require('discord.js');
//const request = require('request-promise-native');
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
	if(mainChannelID.length) {
		mainChannel = client.channels.get(mainChannelID);
		mainChannel.send('HoP in the office!');
	};
});

client.on('message', async message => {

	if (message.author.bot || message.channel.type === 'dm' || message.content[0] !== ".") {
		return;
	};

	if(!(mainChannelID.length && message.channel.id === mainChannelID)) {
		console.log('test');
		return;
	};

	let command = message.content.toLowerCase().split(" ")[0];
	let args = message.content.split(" ").slice(1);

	if (command === '.ping') {
		return message.reply('pong');
	};

	if (command === '.help' || command === '.info') {
		return message.reply('Use \`\`.verify %your byond%\`\` to start quest! You also should allow me to PM you.');;
	};

	if (command === ".verify") {
		let byond = args.join(" ");//formatted nickname
		let ckeyByond = ckey(byond);
		let uid = message.author.id;

		if (!ckeyByond || !uid) {
			return;
		};

		let client = message.guild.members.get(uid);
		let secret = Math.random().toString(36).substring(7);
		let byondPofile = "http://www.byond.com/members/" + ckeyByond;

		let pmMessage = `Good day! Your byond: **${byond}**, your secret key is: **${secret}**\n`
		pmMessage += `Place this key in your Shoutbox on ${byondPofile}\n`
		pmMessage += `After this is done send command \`\`.confirm\`\` in our verification channel **#${mainChannel.name}**`;

		//check if we alredy have this account in cache
		let entry = pendingList.filter(entry => entry.uid === uid)[0];
		if(entry) {
			entry.byond = byond;
			entry.secret = secret;
			entry.ckeyByond = ckeyByond;
		} else {
			pendingList.push({uid: uid, byond: byond, secret: secret, ckeyByond: ckeyByond});
		};

		return message.author.send(pmMessage);
	};

	if (command === ".confirm") {
		let uid = message.author.id;

		if (!uid) {
			return;
		};

		let client = message.guild.members.get(uid);
		let entry = pendingList.filter(entry => entry.uid === uid)[0];
		if(!entry) {
			return message.reply('Sorry, I can\'t find you in list... Are you enrolled? Use \`\`.verify %your byond%\`\` first. You also should allow me to PM you.');
		};

		let curTime = new Date().getTime();
		if(lastGetRequest+getRequestDelay > curTime) {
			return message.reply('Too many requests, wait some time.');
		} else {
			lastGetRequest = curTime;
		};

		let response;
		try {
			response = await axios.get('http://www.byond.com/members/'+entry.ckeyByond);
			if(response.status !== 200) {
				throw "Site problem"
			};
		} catch (error) {
			console.log(error);
			return message.reply('Something is broken, please try again later');
		};

		try {
			const $ = cheerio.load(response.data);
			let success = false;
			//shitty part because byond site is not parsable
			let comments = $('.shoutbox_comment');
			if(!comments.length) {
				throw "Wrong byond profile";
			};
			comments.each((index, el) => {
				let comment = $(el);
				if(ckey($('.shoutbox_comment_header a', comment).text()) === entry.ckeyByond) {
					let msgSecret = comment.text().replace(/\s\s+/g, ' ').trim().split(" ").slice(-1)[0];//fun
					if(msgSecret === entry.secret) {
						success = true;
						return false;
					};
				};

				if(!success) {
					throw "Secret not found";
				};
			});
		} catch (error)	{
			console.log(error);
			return message.reply('Sorry, I can\'t confirm your account. Check your secret code or request some help.');
		};

		try {
			await client.guild.members.get(uid).setNickname(entry.byond);
			let role = await message.guild.roles.find("name", verifiedGroup);
			await client.guild.members.get(uid).addRole(role);
		} catch (error) {
			console.log(error);
			return message.reply("Sorry, I can't give you a role/nickname. Perhaps you have more permissions than me.");
		};

		return message.reply(`Account ${entry.byond} verified, welcome!`);
	};
});

function ckey(name) {
	return name.replace(/[ /.]/g, '').toLowerCase();
}

client.login(discordToken);
