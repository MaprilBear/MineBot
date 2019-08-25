const Command = require("./Command");
const mojang = require('mojang-api');
const {JSDOM} = require("jsdom");
const { window } = new JSDOM();
const $ = require('jquery')(window);
const Discord = require('discord.js');
const DiscordClient = new Discord.Client();
const token = process.argv[2];
const MongoClient = require('mongodb').MongoClient;
var ip = "66.235.174.205:25580";
var prefix;
var helpText =
    "General:\n" +
    "- %status - lists all players connected to the server\n" +
    "- %ip - returns the server's IP address\n" +
    "- %motd - returns the server's message of the day\n" +
    "- %whois [name] - returns the discord tag of a Minecraft player provided they have been registered on any server \n" +
    "\n" +
    "Administrative:\n" +
    "- %setip [ip] - changes the server's ip address (You must set this value before using any commands that require a server to be set) \n" +
    "- %setprefix [prefix] - changes the bot's prefix for commands (cannot be $)";

//MongoDB
const uri = process.argv[3];
var DirtDB;
const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoClient.close();
mongoClient.connect( function(err, db) {
    if (err) throw err;
    DirtDB = mongoClient.db("DirtDB");
});


//Commands
const helpCommand = new Command("help", function(msg){
    return new Promise(function (resolve) {
        msg.author.createDM().then(DM => msg.author.send(helpText).then(m => resolve("HELP command SUCCESS: Sent help message to " + msg.author.tag + '(' + msg.author.id + ")")));
    })
});

const statusCommand = new Command("status", function(msg){
    return new Promise(function (resolve) {
        $.getJSON('https:/api.mcsrvstat.us/2/' + ip, function (status) {
            if (status === null || status === undefined){
                msg.reply("Could not connect to Minecraft API");
                resolve("STATUS command FAILED: could not connect to API");
            }else if(status.online === false){
                msg.reply("The server is currently offline :x:. Please refer to any announcements regarding the status of the server");
                resolve("STATUS command SUCCESS: OFFLINE");
            } else {
                //Show a list of players
                var playerList;
                if (status.players.online > 1) {
                    playerList = status.players.online + " players connected: ";
                } else if (status.players.online === 1) {
                    playerList = status.players.online + " player connected: ";
                } else {
                    playerList = "0 players connected  "
                }
                $.each(status.players.list, function (index, player) {
                    playerList += player + ", ";
                });

                //Show a list of plugins
                /*var pluginListRaw = status.plugins.names;
                var pluginListClean = "";
                for (let x in pluginListRaw){
                    pluginListClean += x + " ";
                }

                 */

                msg.reply("The server is ONLINE :white_check_mark: running version " + status.version + " with " + playerList.substring(0, playerList.length - 2));
                resolve("STATUS command SUCCESS: ONLINE, Version: " + status.version + ", Players: " + playerList.substring(0, playerList.length - 2));
            }
        });
    })
});

const setServerIPCommand = new Command("setip", function (msg) {
    return new Promise(function (resolve) {
        if (msg.content.indexOf(" ") === -1) {
            msg.reply("Missing argument");
            resolve('SEIP command FAILED: missing argument');
        } else if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')) {
            var newIP = msg.content.split(" ")[1];
            this.ip = newIP;
            DirtDB.collection("Settings").findOne({serverid: msg.guild.id}, function (err, result) {
                console.log(result);
                result.ip = newIP;
                DirtDB.collection('Settings').replaceOne({serverid: msg.guild.id}, result);
                msg.reply("server IP set to " + newIP);
                resolve("SETIP command SUCCESS: IP: " + newIP);
            });

        } else {
            msg.reply("You lack the required permissions to execute this command");
            resolve("SETIP command FAILED: insufficient permissions");
        }

    })
});

const serverIPCommand = new Command("ip", function (msg){
    return new Promise(function (resolve) {
        msg[0].reply(msg[1]);
        resolve("IP command SUCCESS: " + msg[1]);
    })
});

const motdCommand = new Command("motd", function(msg){
    return new Promise(function (resolve) {
        $.getJSON('https:/api.mcsrvstat.us/2/66.235.174.205:25580', function(status) {
            if (status === null || status === undefined){
                msg.reply("Could not connect to Minecraft API");
                resolve("MOTD command FAILED: could not connect to API");
            } else if (status.online === false){
                msg.reply("The server is currently offline :x:. Please refer to any announcements regarding the status of the server");
                resolve("MOTD command FAILED: server offline");
            } else if (status.motd.clean[1] === undefined){
                msg.reply(status.motd.clean[0]);
                resolve("MOTD command SUCCESS: " + status.motd.clean[0]);
            } else {
                msg.reply(status.motd.clean[0] + " " + status.motd.clean[1]);
                resolve("MOTD command SUCCESS: " + status.motd.clean[0] + " " + status.motd.clean[1]);
            }
        });
    });
});

const setPrefixCommand = new Command('setprefix', function (msg) {
    return new Promise(function (resolve) {
        if (msg.content.indexOf(" ") === -1){
            msg.reply("Missing argument");
            resolve("SETPREFIX command FAILED: missing argument");
        } else if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')){
            var newPrefix = msg.content.split(" ")[1];
            this.prefix = newPrefix;
            DirtDB.collection("Settings").findOne({serverid: msg.guild.id}, function (err, result) {
                if (err) console.log("SETPREFIX command FAILED: could not find server");
                result.prefix = newPrefix;
                DirtDB.collection('Settings').replaceOne({serverid: msg.guild.id}, result, function(err, result){
                    if (err) console.log("SETPREFIX command FAILED: could not set prefix");
                    msg.reply("MineBot's prefix has been changed to " + newPrefix);
                    resolve("SETPREFIX command SUCCESS: changed prefix to " + newPrefix);
                });
            })
        } else {
            msg.reply("You lack the required permissions to execute this command");
            resolve("SETPREFIX command FAILED: insufficient permissions");
        }
    })
});



const whoIsCommand = new Command('whois', function (msg) {
    return new Promise(function (resolve) {
        if (msg.content.indexOf(" ") === -1){
            msg.reply("Missing argument");
            resolve("WHOIS command FAILED: missing argument");
        } else try {
            mojang.nameToUuid(msg.content.split(" ")[1], function (err, result) {
                if (result === null || result === undefined || result.length < 1){
                    msg.reply("Player does not exist");
                   resolve("WHOIS command FAILED: player does not exist")
                } else {
                    var resolveVal = "Player found: Username: " + result[0].name + ", UUID: " + result[0].id;

                    DirtDB.collection('Players').findOne({uuid: result[0].id}, function (err, result) {
                        if (err){
                            resolveVal += '\n' + ("WHOIS command FAILED: could not contact MongoDB");
                        } else if (result === null || result === undefined){
                            msg.reply("Specified Player has not been registered)");
                            resolveVal += '\n' + ("WHOIS command FAILED: player has not been registered");
                        } else {
                            var discordID = result.discordid;
                            DiscordClient.fetchUser(discordID).then(r => msg.reply(r.tag));
                            resolveVal += '\n' + ("WHOIS command SUCCESS: ID: " + discordID);

                            //IF MENTIONS
                            /*
                            console.log("Discord ID: " + discordID);
                            msg.reply("<@" + discordID + ">").then(sent => console.log(sent.mentions.users.array()[0].tag));

                             */
                        }


                    });
                    resolve(resolveVal);
                }
            });
        } catch (err){
            msg.reply("Invalid name (Misspelled or not registered)");
            resolve("WHOIS command FAILED: Invalid name");
        }
    })
});

const registerCommand = new Command("register", function (msg) {
    return new Promise(function (resolve) {
        if (msg.content.indexOf(" ") === -1){
            msg.reply("Missing argument");
            msg.delete();
            resolve("REGISTER command FAILED: missing argument, deleted message");

        } else if (!(msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')) && msg.content.substring(0,1) !== prefix){
            msg.author.createDM();
            msg.author.send("Registration channels are for registration only").then(msg => console.log("register command: Warning message sent to " + msg.channel.recipient.tag));
            msg.delete();
            resolve("REGISTER command FAILED: insufficient permissions, deleted message");
        } else {
            DirtDB.collection("Settings").findOne({discordid: msg.author.id}, function (err, result) {
                if (result === null){
                    mojang.nameToUuid(msg.content.split(" ")[1], function(err, result){
                        if (result === null || result === undefined || result.length < 1){
                            msg.reply("Player does not exist, (Possible Misstype)");
                            resolve("REGISTER command FAILED: player does not exist")
                        } else {
                            DirtDB.collection("Players").insertOne({
                                uuid: result[0].id,
                                discordid: msg.author.id
                            }).then(function () {
                                msg.reply("Your name has been successfully registered. If this was a mistake please contact this Bot's author Panda#4724");
                                resolve("REGISTER command: " + msg.content.split(" ")[1] + " registered to " + msg.author.tag);
                            })
                        }
                    });
                } else {
                    msg.reply('Your name has already been registered');
                    resolve("REGISTER command FAILED: already registered, deleted message");
                }
            });
        }
    });

});

//End of Commands

var started = false;

function setPresence() {
    DiscordClient.user.setActivity(' Made By MaprilApril', {type: 'LISTENING'});
}

//Startup
DiscordClient.on('ready', () => {
    started = true;
    console.log(`Logged in as ${DiscordClient.user.tag}!`);
    setPresence();
    console.log("Removed " + DiscordClient.sweepMessages(lifetime = Number(600)) + " messages");
    setInterval(function () {console.log("Removed " + DiscordClient.sweepMessages(lifetime = Number(600)) + " messages");}, 600000);
    console.log();
});

DiscordClient.on('guildCreate', guild =>{
    DirtDB.collection("Settings").insertOne({serverid: guild.id, prefix: '%', serverip: ''}, function () {
        console.log("Added Guild: " + guild.id() + " to DB");
    });
    console.log();
});

//Message Received
DiscordClient.on('message', msg => {


    //Check for commands and prevent response to bots
    if(!msg.author.bot){
        console.log("Message Recieved: Author: " + msg.author.id + ", Guild: " + msg.guild.id);

        //Connect to Mongo and setup ip and prefix
        DirtDB.collection("Settings").findOne({serverid: msg.guild.id}, function (err, result) {
            if (err){
                console.log("could not find server, aborting command");
            } else {
                prefix = result.prefix;
                ip = result.ip;
                console.log("Guild Prefix: " + prefix + ', Server IP: ' + ip);

                //Register
                if (msg.channel.id === "610608225246511131" && registerCommand.getRegex(prefix).test(msg.content)) {
                    console.log("REGISTER command called");
                    registerCommand.onCall(msg)

                    //Help
                } else if (helpCommand.getRegex(prefix).test(msg.content)) {
                    console.log("HELP command called");
                    helpCommand.onCall(msg);

                    //Players
                } else if (statusCommand.getRegex(prefix).test(msg.content)) {
                    console.log("STATUS command called");
                    statusCommand.onCall(msg);

                    //Set Server IP
                } else if (setServerIPCommand.getRegex(prefix).test(msg.content)) {
                    console.log("SETIP command called");
                    setServerIPCommand.onCall(msg);

                    //ServerIP
                } else if (serverIPCommand.getRegex(prefix).test(msg.content)) {
                    console.log("SERVERIP command called");
                    serverIPCommand.onCall([msg, ip]);

                    //MOTD
                } else if (motdCommand.getRegex(prefix).test(msg.content)) {
                    console.log("MOTD command called");
                    motdCommand.onCall(msg);

                    //Set Prefix
                } else if (setPrefixCommand.getRegex(prefix).test(msg.content)) {
                    console.log("SETPREFIX command called");
                    setPrefixCommand.onCall(msg);

                    //Force Quit
                } else if (msg.author.id === "183958085763727360" && msg.content === "!@#forcequit") {
                    console.log("FORCE QUIT by owner");
                    mongoClient.close(function () {
                        process.exit();
                    });

                    //Who Is
                } else if (whoIsCommand.getRegex(prefix).test(msg.content)) {
                    console.log("WHOIS command called");
                    whoIsCommand.onCall(msg);

                //Invalid command
                } else if (msg.content.substring(0, 1) === prefix) {
                    msg.reply("Invalid command (Check for misspellings or missing argument)");
                    console.log("COMMAND INVALID\n")
                } else {
                    console.log("NO COMMAND\n");
                }
            }
        })
    }
});

DiscordClient.login(token);


process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    mongoClient.close(true, function () {
        process.exit();
    });
});




