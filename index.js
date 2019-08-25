const Command = require("./Command");
const mojang = require('mojang-api');
const InputCommand = require("./InputCommand");
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
const helpCommand = new Command("help", function (msg) {
    msg.author.createDM(function () {
        msg.author.send(helpText);
    });
});

const statusCommand = new Command("status", function (msg) {
    console.log(ip);
    $.getJSON('https:/api.mcsrvstat.us/2/' + ip, function (status) {
        if(status.online === false){
            msg.reply("The server is currently offline :x:. Please refer to any announcements regarding the status of the server");
        } else {
            //Show a list of players
            var playerList;
            if (status.players.online > 1) {
                playerList = status.players.online + " players connected: ";
            } else if (status.players.online === 1) {
                playerList = status.players.online + " player connected: ";
            } else {
                playerList = "0 players connected "
            }
            $.each(status.players.list, function (index, player) {
                console.log(player);
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
        }
    });
});

const setServerIPCommand = new InputCommand("setip", function (msg) {
    if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')){
        var newIP = msg.content.split(" ")[1];
        this.ip = newIP;
        DirtDB.collection("Settings").findOne({serverid: msg.guild.id}, function (err, result) {
            console.log(result);
            result.ip = newIP;
            DirtDB.collection('Settings').replaceOne({serverid: msg.guild.id}, result);
        });
        msg.reply("server IP set to " + newIP);
    } else {
        msg.reply("You lack the required permissions to execute this command")
    }
});

const serverIPCommand = new Command("ip", function (){});

const motdCommand = new Command("motd", function(msg){
    $.getJSON('https:/api.mcsrvstat.us/2/66.235.174.205:25580', function(status) {
        if (status.motd.clean[1] === undefined){
            msg.reply(status.motd.clean[0]);
        } else {
            msg.reply(status.motd.clean[0] + " " + status.motd.clean[1]);
        }
    });
});

const setPrefixCommand = new Command('setprefix', function (msg) {
    if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')){
        var newPrefix = msg.content.split(" ")[1];
        console.log(newPrefix);
        this.prefix = newPrefix;
        DirtDB.collection("Settings").findOne({serverid: msg.guild.id}, function (err, result) {
            if (err) throw err;
            result.prefix = newPrefix;
            DirtDB.collection('Settings').replaceOne({serverid: msg.guild.id}, result, function(err, result){
                if (err) throw err;
                console.log("prefix changed");
                msg.reply("MineBot's prefix has been changed to " + newPrefix);
            });
        })
    } else {
        msg.reply("You lack the required permissions to execute this command")
    }
});



const whoIsCommand = new Command('whois', function (msg) {

    try {
        mojang.nameToUuid(msg.content.split(" ")[1], function (err, result) {
            if (result === null || result === undefined || result.length < 1){
                msg.reply("Player does not exist");
            } else {
                console.log("Name: " + result[0].name);
                console.log("UUID: " + result[0].id);

                DirtDB.collection('Players').findOne({uuid: result[0].id}, function (err, result) {
                    if (result === null || result === undefined){
                        msg.reply("Specified Player has not been registered");
                    } else {
                        var discordID = result.discordid;
                        DiscordClient.fetchUser(discordID).then(r => msg.reply(r.tag));

                        //IF MENTIONS
                        /*
                        console.log("Discord ID: " + discordID);
                        msg.reply("<@" + discordID + ">").then(sent => console.log(sent.mentions.users.array()[0].tag));

                         */
                    }


                })
            }
        });
    } catch (err){
        msg.reply("Invalid name (Misspelled or not registed");
    }
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
});

DiscordClient.on('guildCreate', guild =>{
    DirtDB.collection("Settings").insertOne({serverid: guild.id, prefix: '%', serverip: ''});
});

//Message Received
DiscordClient.on('message', msg => {


    //Check for commands
    if(msg.author === DiscordClient.user){}else {



        console.log(msg.author.id);

        //Connect to Mongo and setup ip and prefix
        DirtDB.collection("Settings").findOne({serverid: msg.guild.id}, function (err, result) {
            prefix = result.prefix;
            ip = result.ip;
            console.log(prefix);
            console.log(ip);

            //register
            if(msg.channel.id === "610608225246511131"){
                if (RegExp(prefix + "register .+").test(msg.content)){
                    DirtDB.collection("Settings").findOne({discordid: msg.author.id}, function (err, result) {
                        if (result === null){
                            DirtDB.collection("Settings").insertOne({uuid: mojang.nameToUuid(msg.content.split(" ")[1]), discordid: msg.author.id}, undefined, function () {
                                msg.reply("Your name has been successfully registered. If this was a mistake please contact this Bot's author Panda#4724");
                            })
                        } else {
                            msg.reply('Your name has already been registered')
                        }
                    });
                } else {
                    if (!(msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins'))){
                        msg.author.createDM().then(dm => msg.author.send("Registration channels are for registration only"));
                        msg.reply("This channel is for registering names only");
                        msg.delete();
                    }
                }


            }

            if (helpCommand.getRegex(prefix).test(msg.content)) {
                console.log("help");
                helpCommand.onCall(msg);

                //Players
            } else if (statusCommand.getRegex(prefix).test(msg.content)) {
                console.log("status");
                statusCommand.onCall(msg);

                //Set Server IP
            } else if (setServerIPCommand.getRegex(prefix).test(msg.content)) {
                console.log("setServer");
                setServerIPCommand.onCall(msg);

                //ServerIP
            } else if (serverIPCommand.getRegex(prefix).test(msg.content)) {
                console.log("serverIP");
                msg.reply(ip);

                //MOTD
            } else if (motdCommand.getRegex(prefix).test(msg.content)) {
                console.log("motd");
                motdCommand.onCall(msg);
            } else if (setPrefixCommand.getRegex(prefix).test(msg.content)) {
                console.log("setprefix");
                setPrefixCommand.onCall(msg);
            } else if(msg.author.id === "183958085763727360" && msg.content === "!@#forcequit"){
                mongoClient.close(function () {
                    process.exit();
                })
            } else if (whoIsCommand.getRegex(prefix).test(msg.content)){
                console.log("whoIs command:");
                whoIsCommand.onCall(msg);
            } else if(msg.content.substring(0,1) === prefix){
                msg.reply("Invalid command or argument (Check for misspellings or missing argument");
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




