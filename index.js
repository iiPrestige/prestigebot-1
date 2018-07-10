const Discord = require('discord.js');
const prestige = new Discord.Client();

inv.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});
inv.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});
prestige.on('ready', () => {
    inv.user.setPresence({ game: { name: ` myself being developed!`, type: 'WATCHING' } });
    inv.setMaxListeners(99);
    
});
let prefix = [`&`];
prestige.on('message', async message => {
    if (message.author.bot) return;
    if (message.content.indexOf(prefix) !== 0) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (message.channel.type === "dm") return;

if (command === 'ping') {
        const m = await message.channel.send("Ping?");
        return m.edit(`Latency Is ${m.createdTimestamp - message.createdTimestamp}MS - API Latency Is ${Math.round(inv.ping)}MS`);
    }
    if (command === "dict") {
        const urban = require("urban");
        if (args.length < 1) return message.reply("Please enter something!");
        let forsrh = args.join(" ");
        urban(forsrh).first(json => {
            if (!json) return message.reply("No results found!");
            let Dictionary = new Discord.RichEmbed()
                .setTitle(json.word)
                .setColor(0x550055)
                .setDescription(json.definition)
                .addField("Upvotes", json.thumbs_up, true)
                .addField("Downvotes", json.thumbs_down, true)
                .setFooter(`Author: ${json.author}`);

            message.channel.send(Dictionary);
        });
    }
if (command === "google") {
        const got = require('got');
        const cheerio = require('cheerio');
        const { stringify } = require('querystring');
        if (args.length < 1) message.channel.send('I need to know what to search...');
        await message.channel.send('<a:loading:465944291634839554> Googling....').then(message => { message.delete(1000) });
        const params = {
            q: args.join(' '),
            safe: 'on',
            lr: 'lang_en',
            hl: 'en'
        };
        let resp = await got('https://google.com/search?' + stringify(params), { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) Gecko/20100101 Firefox/53.0' } });
        if (resp.statusCode !== 200) throw 'Google is not responding';
        const $ = cheerio.load(resp.body);
        const results = [];
        let card = null;
        const cardNode = $('div#rso > div._NId').find('div.vk_c, div.g.mnr-c.g-blk, div.kp-blk');
        if (cardNode && cardNode.length !== 0) {
            card = this.parseCards($, cardNode);
        }
        $('.rc > h3 > a').each((i, e) => {
            const link = $(e).attr('href');
            const text = $(e).text();
            if (link) {
                results.push({ text, link });
            }
        });
        if (card) {
            const value = results.slice(0, 3).map(r => `[${r.text}](${r.link})`).join('\n');
            if (value) {
                card.addField(`This is what I also found for: "${params.q}" `, value)
                    .setColor(inv.utils.randomColor())
                    .setURL(`https://google.com/search?q=${encodeURIComponent(params.q)}`);
            }
            return await message.channel.send(card);
        }
        if (results.length === 0) {
            return await message.channel.send("Sorry, I didn't find any results");
        }
        const firstentry = `${results[0].link}`;
        const finalxd = results.slice(0, 2).map(r => `${r.link}`).join('\n');
        await message.channel.send(finalxd);
    }
    if (command === "kick") {
        if (!message.member.hasPermission("KICK_MEMBERS"))
            return message.channel.send("Sorry, you don't have permissions to use this!");
        let tokick = message.mentions.members.first();
        if (!tokick) return message.channel.send("Kick Who?")
        if (tokick.id === "291221132256870400")
            return message.channel.send("No")
        if (tokick.kickable)
            return message.channel.send("I cannot kick this user!");
        let reason = args.slice(1).join(' ');
        if (!reason) {
            reason = "No reason given";
        } else {
            reason = `${reason}`
        }
        await tokick.kick(reason)
            .catch(error => message.reply(`Sorry, I couldn't kick because of : ${error}`));
        message.channel.send(`${tokick} has been **kicked** from the server for: ${reason}`)
        message.delete();
    }

    if (command === "ban") {
        if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sorry, you don't have permissions to use this!");
        let Fopban = message.mentions.members.first();
        if (Fopban.id === "291221132256870400") return message.channel.send("NO U")
        if (!Fopban) return message.channel.send("Who do you want me to ban, I am ready to use that banhammer")
        if (!Fopban.bannable)
            return message.channel.send("I cannot ban this user!");
        if (Fopban.id === message.author.id)
            return message.channel.send("You can't kick your self!")
        let reason = args.slice(1).join(' ');
        if (!reason) {
            reason = "No reason given";
        } else {
            reason = `${reason}`
        }
        await Fopban.ban(reason)
            .catch(error => message.reply(`Sorry, I couldn't ban because of : ${error}`));
        message.channel.send(`${Fopban} has been **banned** from the server for: ${reason}`)
    }
if (command === "mute") {
        const ms = require("ms");
        let UserMute = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
        if (!UserMute) return message.channel.send("Please tag user to mute!");
        if (!message.guild.me.permissions.has("MANAGE_SERVER")) return message.reply("I cant do that")
        if (UserMute.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Sorry, you don't have permissions to use this!");
        if (UserMute.id === message.author.id) return message.channel.send("You cannot mute yourself!");
        let MutedRol = message.guild.roles.find(`name`, "Muted");
        if (!MutedRol) {
            try {
                MutedRol = await message.guild.createRole({
                    name: "Muted",
                    color: "#000000",
                    permissions: []
                })
                message.guild.channels.forEach(async (channel, id) => {
                    await channel.overwritePermissions(MutedRol, {
                        SEND_MESSAGES: false,
                        ADD_REACTIONS: false
                    });
                });
            } catch (e) {
                console.log(e.stack);
            }
        }
        let MuteTime = args[1]
        if (!MuteTime) return message.channel.send("For how long do you want to mute?");
        await (UserMute.addRole(MutedRol.id));
        message.reply(`<@${UserMute.id}> has been muted for ${ms(ms(MuteTime))}`);
        setTimeout(function () {
            UserMute.removeRole(MutedRol.id);
            message.channel.send(`<@${UserMute.id}> has been unmuted!`);
        }, ms(MuteTime));

        message.delete();
    }
if(command === "prune"){

message.delete()

  if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have premssions to do that!");
  if(!args[0]) return message.channel.send("Please enter a number of messages to prune! ");
  message.channel.bulkDelete(args[0]).then(() => {
  message.channel.send(`**__Pruned ${args[0]} messages.__**`).then(msg => msg.delete(2000));
});
}
if(command === "8 ball"){
if(!args[1]) return message.reply("Plesae enter a full question with 2 or more words!");
    let replies = ["Yes", "No", "I don't know", "Ask again later!", "NO U", "I am not sure!", "Pls No", "You tell me", "Without a doubt", "Cannot predict now", "Without a doubt", ];

    let result = Math.floor((Math.random() * replies.length));
    let question = args.join(" ");

    let ballembed = new Discord.RichEmbed()

    .setAuthor(message.author.username)
    .setColor("#00ff00")
    .addField("Question", question)
    .addField("Answer", replies[result]);

    message.channel.send(ballembed)

    message.delete();
}
});
prestige.login("token");
