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
    "General:\n\n" +
    "%player - lists all players connected to the server\n" +
    "%ip - returns the server's IP address\n" +
    "\n" +
    "Administrative\n\n" +
    "%setip - changes the server's ip address (You must set this value before using any commands that require a server to be set)";

//Commands

function help(msg){
    msg.author.createDM();
    msg.author.send(helpText);

}

function players(msg) {
    $.getJSON('https:/api.mcsrvstat.us/2/66.235.174.205:25580', function (status) {
        if(status.online === false){
            msg.reply("The server is currently down. Please refer to any announcements regarding the status of the server");
        } else {
            //Show the version
            console.log(status.version);

            //Show a list of players
            var playerList;
            if (status.players.online > 1) {
                playerList = status.players.online + " people are currently playing: ";
            } else if (status.players.online === 1) {
                playerList = status.players.online + " person is currently playing: ";
            } else {
                playerList = "no one is playing :("
            }
            $.each(status.players.list, function (index, player) {
                console.log(player);
                playerList += player + " ";
            });

            msg.reply(playerList);
        }
    });
}


function setServerIP(msg) {
    if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')){
        ip = msg.content.split(" ")[1];
        msg.reply("server IP set to " + ip);
    }
}

const helpCommand = new Command("help", prefix, help);
const playersCommand = new Command("players", prefix, players);
const setServerIPCommand = new InputCommand("setip", prefix, setServerIP);
const serverIPCommand = new Command("ip", prefix, function (){});


console.log(helpCommand.getRegex());

//End of Commands

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
        } else if (playersCommand.getRegex().test(msg.content)) {
            console.log("players");
            playersCommand.onCall(msg);

        //Set Server IP
        }else if (setServerIPCommand.getRegex().test(msg.content)) {
            console.log("setServer");
            setServerIPCommand.onCall(msg);

        //ServerIP
        } else if (serverIPCommand.getRegex().test(msg.content)) {
            console.log("serverIP");
            msg.reply(ip);
        }

    }

});

client.login(token);

