const Command = require("./Command");
const InputCommand = require("./InputCommand");
const {JSDOM} = require("jsdom");
const { window } = new JSDOM();
const $ = require('jquery')(window);
const Discord = require('discord.js');
const DiscordClient = new Discord.Client();
const token = process.argv[2];
const MongoClient = require('mongodb').MongoClient;
var ip = "66.235.174.205:25580";
var prefix = "%";
var helpText =
    "General:\n" +
    "- %player - lists all players connected to the server\n" +
    "- %ip - returns the server's IP address\n" +
    "\n" +
    "Administrative:\n" +
    "- %setip - changes the server's ip address (You must set this value before using any commands that require a server to be set)";

//MongoDB
const uri = process.argv[3];
const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoClient.close();
mongoClient.connect( function(err, db) {
    if (err) throw err;
});

//Commands
const helpCommand = new Command("help", help);
function help(msg){
    msg.author.createDM();
    msg.author.send(helpText);

}

const statusCommand = new Command("status", players);
function players(msg) {
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
                playerList += player + " ";
            });

            //Show a list of plugins
            /*var pluginListRaw = status.plugins.names;
            var pluginListClean = "";
            for (let x in pluginListRaw){
                pluginListClean += x + " ";
            }

             */

            msg.reply("The server is ONLINE :white_check_mark: running version " + status.version + " with " + playerList + "running " + status.software);
        }
    });
}

const setServerIPCommand = new InputCommand("setip", setServerIP);
function setServerIP(msg) {
    if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')){
        var newIP = msg.content.split(" ")[1];
        mongoClient.db("DirtDB").collection("Settings").findOne({serverid: msg.guild.id}, function (err, result) {
            console.log(result);
            result.ip = newIP;
            mongoClient.db("DirtDB").collection('Settings').replaceOne({serverid: msg.guild.id}, result);
        });
        msg.reply("server IP set to " + newIP);
    }
}

const serverIPCommand = new Command("ip", function (){});

const motdCommand = new Command("motd", motd);
function motd(msg){
    $.getJSON('https:/api.mcsrvstat.us/2/66.235.174.205:25580', function(status) {
        if (status.motd.clean[1] === undefined){
            msg.reply(status.motd.clean[0]);
        } else {
            msg.reply(status.motd.clean[0] + " " + status.motd.clean[1]);
        }
    });
}

//End of Commands

var started = false;

function setPresence() {
    DiscordClient.user.setActivity(prefix + ' & Made By MaprilApril', {type: 'LISTENING'});
}

//Startup
DiscordClient.on('ready', () => {
    started = true;
    console.log(`Logged in as ${DiscordClient.user.tag}!`);
    setPresence();
});

//Message Received7
DiscordClient.on('message', msg => {


    //Check for commands
    if(msg.author === DiscordClient.user){}else {

        console.log(msg.guild.id);

        //Connect to Mongo and setup ip and prefix
        mongoClient.db("DirtDB").collection("Settings").findOne({serverid: msg.guild.id}, function (err, result) {
            prefix = result.prefix;
            ip = result.ip;
            console.log(prefix);
            console.log(ip);
        });

        //Help
        if(helpCommand.getRegex(prefix).test(msg.content)){
            console.log("help");
            helpCommand.onCall(msg);

        //Players
        } else if (statusCommand.getRegex(prefix).test(msg.content)) {
            console.log("status");
            statusCommand.onCall(msg);

        //Set Server IP
        }else if (setServerIPCommand.getRegex(prefix).test(msg.content)) {
            console.log("setServer");
            setServerIPCommand.onCall(msg);

        //ServerIP
        } else if (serverIPCommand.getRegex(prefix).test(msg.content)) {
            console.log("serverIP");
            msg.reply(ip);

        //MOTD
        } else if (motdCommand.getRegex(prefix).test(msg.content)){
            console.log("motd");
            motdCommand.onCall(msg);
        }

    }

});

DiscordClient.login(token);
