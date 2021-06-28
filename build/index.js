"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
dotenv_1.config();
const discord_js_1 = require("discord.js");
const yt_search_1 = __importDefault(require("yt-search"));
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const client = new discord_js_1.Client();
client.on("ready", () => console.log('Online!'));
client.on("message", message => {
    if (message.author.bot || message.author.id !== '306519124731887619')
        return;
    const member = message.member;
    const guild = message.guild;
    const me = guild === null || guild === void 0 ? void 0 : guild.me;
    // Join command
    if (message.content === '.join' && member) {
        const channel = member.voice.channel;
        if (!channel || channel.type !== 'voice')
            return message.reply('Not in voice');
        if (!channel.joinable)
            return message.reply('I cannot join');
        channel.join()
            .then(() => console.log(`joined to voice: ${channel}`))
            .catch((error) => console.log('join error', error));
    }
    if (message.content.startsWith('.play') && member && guild && me) {
        const musicSearch = message.content.replace('.play', '');
        if (!musicSearch)
            return;
        yt_search_1.default(musicSearch)
            .then(async (sr) => {
            const getResult = (video, index) => ([
                `[#${index + 1}] **${video.title}**`,
                `*${video.description}*`,
                '\n'
            ]);
            const rawList = sr.videos.slice(0, 5);
            const list = rawList.map(getResult);
            const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
            const reactMessageButtons = (count) => (m) => {
                Array(count).fill(null).forEach((e, i) => m.react(numbers[i]));
            };
            const listMessage = await message.channel.send(list);
            reactMessageButtons(list.length)(listMessage);
            const filter = (reaction, user) => user.id === message.author.id;
            const collection = await listMessage.awaitReactions(filter, { max: 1, time: 30000 });
            await listMessage.reactions.removeAll();
            const selectedEmoji = collection.first();
            if (collection.size !== 1 || !selectedEmoji)
                return;
            const selectedIndex = numbers.findIndex(e => e === selectedEmoji.emoji.toString());
            const selectedTrack = rawList[selectedIndex];
            await message.channel.send(list[selectedIndex]);
            const connection = me.voice.connection;
            if ( /*member.voice.channel?.id === me.voice.channel?.id &&*/connection) {
                try {
                    const stream = ytdl_core_1.default(selectedTrack.url, { filter: 'audioonly' });
                    const dispatcher = connection.play(stream);
                    dispatcher.on('start', () => console.log(`Playing - ${selectedTrack.url}`));
                    dispatcher.on('finish', () => {
                        dispatcher.destroy();
                        connection.disconnect();
                    });
                    dispatcher.on('error', (err) => console.log(err));
                }
                catch (e) {
                    console.log(e);
                }
            }
        })
            .catch(e => e);
    }
});
client.on('voiceStateUpdate', (oldVoice, newVoice) => {
    var _a, _b, _c, _d;
    if (!((_b = (_a = oldVoice.guild.me) === null || _a === void 0 ? void 0 : _a.voice.channel) === null || _b === void 0 ? void 0 : _b.members.size))
        (_d = (_c = oldVoice.guild.me) === null || _c === void 0 ? void 0 : _c.voice.connection) === null || _d === void 0 ? void 0 : _d.disconnect();
});
client.login(process.env.token || '')
    .then(() => console.log('Logged in'))
    .catch(() => console.log('Login error'));
