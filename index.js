const Command = require("./Command");
const InputCommand = require("./InputCommand");
const {JSDOM} = require("jsdom");
const { window } = new JSDOM();
const $ = require('jquery')(window);
const Discord = require('discord.js');
const client = new Discord.Client();
const token = process.argv[2];
var ip = "66.235.174.205:25580";
var prefix = "%";
var helpText =
    "General:\n" +
    "- %player - lists all players connected to the server\n" +
    "- %ip - returns the server's IP address\n" +
    "\n" +
    "Administrative:\n" +
    "- %setip - changes the server's ip address (You must set this value before using any commands that require a server to be set)";

//Commands
const helpCommand = new Command("help", prefix, help);
function help(msg){
    msg.author.createDM();
    msg.author.send(helpText);

}

const statusCommand = new Command("status", prefix, players);
function players(msg) {
    $.getJSON('https:/api.mcsrvstat.us/2/66.235.174.205:25580', function (status) {
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

const setServerIPCommand = new InputCommand("setip", prefix, setServerIP);
function setServerIP(msg) {
    if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')){
        ip = msg.content.split(" ")[1];
        msg.reply("server IP set to " + ip);
    }
}

const serverIPCommand = new Command("ip", prefix, function (){});

const motdCommand = new Command("motd", prefix, motd);
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

$.getJSON('https:/api.mcsrvstat.us/2/66.235.174.205:25580', function(status) {
    console.log(status)
});

var started = false;

function setPresence() {
    client.user.setActivity(prefix + ' & Made By MaprilApril', {type: 'LISTENING'});
}

//Startup
client.on('ready', () => {
    started = true;
    console.log(`Logged in as ${client.user.tag}!`);
    setPresence();
});

//Message Received
client.on('message', msg => {

    //Check for commands
    if(msg.author === client.user){}else {

        //Help
        if(helpCommand.getRegex().test(msg.content)){
            console.log("help");
            helpCommand.onCall(msg);

        //Players
        } else if (statusCommand.getRegex().test(msg.content)) {
            console.log("status");
            statusCommand.onCall(msg);

        //Set Server IP
        }else if (setServerIPCommand.getRegex().test(msg.content)) {
            console.log("setServer");
            setServerIPCommand.onCall(msg);

        //ServerIP
        } else if (serverIPCommand.getRegex().test(msg.content)) {
            console.log("serverIP");
            msg.reply(ip);

        //MOTD
        } else if (motdCommand.getRegex().test(msg.content)){
            console.log("motd");
            motdCommand.onCall(msg);
        }

    }

});

client.login(token);

