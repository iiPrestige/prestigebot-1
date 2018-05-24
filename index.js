const Discord = require('discord.js');
const client = new Discord.Client();
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');
const yt = require('ytdl-core');
const YoutubeDL = require('youtube-dl');
const Music = require('discord.js-musicbot-addon');
client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});







client.on('ready', () => {
client.user.setPresence({game: {name: ` myself being developed!`, type: 'WATCHING'}});
console.log(`Succesfully logged as: ${client.user.tag} serving: ${client.guilds.size} servers for: ${client.users.size} users, in: ${client.channels.size} Channels`)
  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
  if (!table['count(*)']) {
    sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER, level INTEGER);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }



  client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
  client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level);");
  

});

let prefix = [`&`];

client.on('message', async message => {
if (message.author.bot) return;
if (message.content.indexOf(prefix) !== 0) return;
const args = message.content.slice(prefix.length).trim().split(/ +/g);
const command = args.shift().toLowerCase();
if (message.channel.type === "dm") return;
let score = client.getScore.get(message.author.id, message.guild.id);


if (!score) {
  score = {
    id: `${message.guild.id}-${message.author.id}`,
    user: message.author.id,
    guild: message.guild.id,
    points: 0, // Each user starts at 0 points by default
    level: 0, //Each user starts at level 0 by default
  }
}


if (command === 'ping') {
const m = await message.channel.send("Ping?");
return m.edit(`Latency Is ${m.createdTimestamp - message.createdTimestamp}MS - API Latency Is ${Math.round(client.ping)}MS`);
}
score.points++;
//Calculate The Current Level Through Math OMG HALP.
const curLevel = Math.floor(0.1 * Math.sqrt(score.points));
// Check If The User Has leveled Up, And Let Them Know If They Have:

client.setScore.run(score);
if (command === 'help') {
let embed = new Discord.RichEmbed()
.addField('Vell\'s Commands', 'Help Menu')
.addField('Prefix', 'My prefix is &')
.addField('profile', 'Displays your profile')
.addField('leaderboard', 'Displays server leaderboard')
.addField('google', 'Googles what you ask for.')
.addField('dict', 'Defines what you search for.')
.addField('status',  'displays the server status for AQ3D game.')
.setColor(`0x550055`)
.setFooter( "Server: " +`${message.guild.name}`,message.guild.iconURL)
return await message.channel.send({embed});
}
//Let A User View Their Points
if(command === "points") {
  return message.reply(`You currently have ${score.points} points and are level ${score.level}!`);
}
if(command === "give") {
  // Limited To Guild Owner
  if(!message.author.id === message.guild.owner) return message.reply("You're not the boss of me, you can't do that!");

  const user = message.mentions.users.first() || client.users.get(args[0]);
  if(!user) return message.reply("You must mention someone or give their ID!");

  const pointsToAdd = parseInt(args[1], 10);
  if(!pointsToAdd) return message.reply("You didn't tell me how many points to give...")

  // Get Their Current Points
  let userscore = client.getScore.get(user.id, message.guild.id);
  // It's possible to give points to a user we haven't seen, so we need to initiate defaults here too!
  if (!userscore) {
    userscore = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, points: 0, level: 1 }
  }
  userscore.points += pointsToAdd;

  // We also want to update their level (but we won't notify them if it changes)
  let userLevel = Math.floor(0.1 * Math.sqrt(score.points));
  userscore.level = userLevel;

  client.setScore.run(userscore);

  return message.channel.send(`${user.tag} has received ${pointsToAdd} points and now stands at ${userscore.points} points.`);
}
//Im dead on the mod commands too :(
if(command === "dict") {
   const urban = require ("urban");
  
  if(args.length < 1) return message.reply("Please enter something!");
  let forsrh = args.join(" ");
  
  urban(forsrh).first(json => {
    if(!json) return message.reply("No results found!")
    
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
  if (command === 'servers') {
    message.channel.send('Bot is in: ' + client.guilds.size + ' servers')
}
  if(command === "google") {
    
    const got = require('got');
    const cheerio = require('cheerio');
    const { stringify } = require('querystring');
   
    if(args.length < 1) message.channel.send('I need to know what to search...');
    
    await message.channel.send('Googling....').then(message => {message.delete(1000)});
    
    const params = {
        q: args.join(' '),
        safe: 'on',
        lr: 'lang_en',
        hl: 'en'
    };
    
    let resp = await got('https://google.com/search?' + stringify(params), { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) Gecko/20100101 Firefox/53.0' }});
    
    if(resp.statusCode !== 200) throw 'Google is not responding';
    
    const $ = cheerio.load(resp.body);

    const results = [];

    let card = null;
    
    const cardNode = $('div#rso > div._NId').find('div.vk_c, div.g.mnr-c.g-blk, div.kp-blk');

    if(cardNode && cardNode.length !== 0) {
        card = this.parseCards($, cardNode);
    }
    
    $('.rc > h3 > a').each((i, e) => {
        const link = $(e).attr('href');
        const text = $(e).text();
        if(link) {
            results.push({ text, link });
        }
    });
    
    if(card) {
        const value = results.slice(0, 3).map(r => `[${r.text}](${r.link})`).join('\n');
        if(value) {
            card.addField(`This is what I also found for: "${params.q}" `, value)
                .setColor(client.utils.randomColor())
                .setURL(`https://google.com/search?q=${encodeURIComponent(params.q)}`);
        }
        return await message.channel.send(card);
    }
    
      if(results.length === 0) {
        return await message.channel.send("Sorry, I didn't find any results");
    }
    
    const firstentry = `${results[0].link}`;
    const finalxd = results.slice(0, 2).map(r => `${r.link}`).join('\n');

    await message.channel.send(finalxd);
    
  }
  

  
  if(command === "kick") {
  
    if(!message.member.hasPermission("KICK_MEMBERS")) return message.channel.send("Sorry, you don't have permissions to use this!");
    
    let tokick = message.mentions.members.first();
    if(!tokick) return message.channel.send("Kick Who?")
    
    if(tokick.kickable) 
      return message.channel.send("I cannot kick this user!");
    
       let reason = args.slice(1).join(' ');
    if(!reason) {
      reason = "No reason given";
    }
    else {
      reason = `${reason}`
    }
    
    await tokick.kick(reason)
      .catch(error => message.reply(`Sorry, I couldn't kick because of : ${error}`));
    

    message.channel.send(`${tokick} has been **kicked** from the server for: ${reason}`)

    message.delete();
  }
  
  if(command === "ban") {
    
   if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sorry, you don't have permissions to use this!");
    
    let Fopban = message.mentions.members.first();
    if(!Fopban) return message.channel.send("Who do you want me to ban i am ready to use that banhammer")
    if(!Fopban.bannable) 
      return message.channel.send("I cannot ban this user!");

      if(Fopban.id === message.author.id)
      return message.channel.send("You can't kick your self!")

    let reason = args.slice(1).join(' ');

    if(!reason) {
      reason = "No reason given";
    }
    else {
      reason = `${reason}`
    }
    
    await Fopban.ban(reason)
      .catch(error => message.reply(`Sorry, I couldn't ban because of : ${error}`));
    
    message.channel.send(`${Fopban} has been **kicked** from the server for: ${reason}`)
    
  }
  if(command === "mute") {
   
    const ms = require("ms");
    let UserMute = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!UserMute) return message.channel.send("Please tag user to mute!");
    if(UserMute.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Sorry, you don't have permissions to use this!");
    if(UserMute.id === message.author.id) return message.channel.send("You cannot mute yourself!");
    
    let MutedRol  = message.guild.roles.find(`name`, "Muted");
    
    if(!MutedRol){
    try{
      MutedRol = await message.guild.createRole({
        name: "Muted",
        color: "#000000",
        permissions:[]
      })
      message.guild.channels.forEach(async (channel, id) => {
        await channel.overwritePermissions(MutedRol, {
          SEND_MESSAGES: false,
          ADD_REACTIONS: false
        });
      });
    }catch(e){
      console.log(e.stack);
    }
  }
    
    let  MuteTime = args[1]
    if(!MuteTime) return message.channel.send("For how long do you want to mute?");
    
      await(UserMute.addRole( MutedRol.id));
  message.reply(`<@${UserMute.id}> has been muted for ${ms(ms(MuteTime))}`);

  setTimeout(function(){
    UserMute.removeRole(MutedRol.id);
    message.channel.send(`<@${UserMute.id}> has been unmuted!`);
  }, ms(MuteTime));

  message.delete();
    
  }

if(command === "leaderboard") {
  const top10 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 10;").all(message.guild.id);

    // Now shake it and show it! (as a nice embed, too!)
  const embed = new Discord.RichEmbed()
    .setTitle("Leaderboard")
    .setAuthor(client.user.username, client.user.avatarURL)
    .setDescription("Our top 10 points leaders!")
    .setColor(0x00AE86);
  
  for(const data of top10) {
    embed.addField(client.users.get(data.user).tag, `${data.points} points (level ${data.level})`);
  }
  return message.channel.send({embed});
}

if (command === "dashboard") {
  message.channel.send("https://vell.glitch.me");
}
  if (command === 'profile') {
  let embed = new Discord.RichEmbed()
  .setTitle('Your Profile')
  .addField(` Level`, `${score.level}`) 
  .addField(` Points`, `${score.points}`)
  .setColor(0x463dfc);
  message.channel.send({embed})
  }
if (command === 'invite') {
  message.channel.send("https://discordapp.com/oauth2/authorize/?permissions=1610079425&scope=bot&client_id=368592012116623362")
}
  
  
  if(command ===  "status") {
    const request = require("request")
    const got = require("got")
    request(`http://game.aq3d.com/api/game/ServerList`, function (error, response, body) {
  if (!error && response.statusCode == 200) {
     
    let parsed = JSON.parse(body);
    let embed = new Discord.RichEmbed()
    .setColor("#00ff00")
    .setTitle("AQ3D Server Status")
    .setDescription("Artix Entertainment ©")
    .addField("Total Online :earth_americas:", parsed[0].UserCount + parsed[1].UserCount)
    .addField("Red Dragon :red_circle:", parsed[0].UserCount)
    .addField("Blue Dragon :large_blue_circle:", parsed[1].UserCount)
    .setFooter("© Vell Bot, Developed by Alphi#5113")
    .setThumbnail("https://cdn.glitch.com/69253168-486e-4092-900b-0b35bbb192e1%2Fimagen.png?1527102788239")
    console.log(parsed) 
    message.channel.send(embed);
    
  }

    });
    
  }
  
  if (command === 'goldmeme') {
    message.channel.send(`@Nathalya#6170`, {
  files: [
    "https://cdn.glitch.com/69253168-486e-4092-900b-0b35bbb192e1%2Fmoney.png?1527126409818"
  ]
    })
  }
Music.start(client, {
  prefix: "&",
  maxQueueSize: "100",
  disableLoop: true,
  leaveHelp: "Bad help text.",
  leaveAlt: ["lve","leev","un1c0rns"],
  helpCmd: 'mhelp',
  leaveCmd: 'begone',
  ownerOverMember: true,
  botOwner: '337343219128074240',
  youtubeKey: 'AIzaSyBs13PG8jLmeL-DWWd34c190Ggi6sl7TP8'
});
if (command === 'char') {
  const request = require("request")
  const cheerio = require('cheerio');
  let namexd = args.join(` `)
  request(`https://https://game.aq3d.com/account/character?id=${namexd}`, function (error, response, html) {
  if (!error && response.statusCode == 200) {
    //message.channel.send(html);
    
    let badg  = response.badges
    
    let embed = new Discord.RichEmbed()
    .setColor("#00ff00")
    .setTitle(namexd)
    .addField("Level", html.find("h1"))
    .addField("Badges", badg)
    
    message.channel.send(embed);
    
  } 
});
}
})

client.login(config.token);
