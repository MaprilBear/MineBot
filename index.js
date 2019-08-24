const {JSDOM} = require("jsdom");
const jsdom = require("jsdom");
const { window } = new JSDOM();
const $ = require('jquery')(window);
const Discord = require('discord.js');
const client = new Discord.Client();
const token = process.argv[2];
var serverIP;
var prefix = "%";
var helpCommand;
var playersCommand;
var settingsCommand;
var setServerIPCommand;
var setPrefixCommand;
var serverIPCommand;
var started = false;

function setPresence(){
    client.user.setActivity(prefix +' & Made By MaprilApril', {type: 'LISTENING'});
}

function regenRegExp(){
    helpCommand = new RegExp(prefix + 'help');
    playersCommand = new RegExp(prefix + 'players');
    settingsCommand = new RegExp(prefix + 'settings');
    setServerIPCommand = new RegExp(prefix + 'setserverip');
    setServerIPCommand = new RegExp(setServerIPCommand.source + ' .+');
    setPrefixCommand = new RegExp(prefix + 'setprefix');
    setPrefixCommand = new RegExp(setPrefixCommand.source + ' .+');
    serverIPCommand = new RegExp((prefix + 'serverip'));
    if (started) {
        setPresence();
    }
}

regenRegExp();

console.log(client);


client.on('ready', () => {
    started = true;
    console.log(`Logged in as ${client.user.tag}!`);
    setPresence();
});

//commands
client.on('message', msg => {

    if(msg.author === client.user){}else {

        if(helpCommand.test(msg.content)){
            var msgToSend = '';
            msg.author.createDM();
            //Admins
            if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')){
                msgToSend += "!setserverip [serverip] to set server ip";
            }
            //Normal
                msgToSend +="\n!players to list all online players \n" +
                                "!serverip to get server IP";
            msg.author.send(msgToSend);
            

        //players
        }else if (playersCommand.test(msg.content)) {
            $.getJSON('https:/api.mcsrvstat.us/2/66.235.174.205:25580', function (status) {
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
            });

            //Set Server IP
        }else if (setServerIPCommand.test(msg.content)) {
            if (msg.member.roles.find(r => r.name === 'Owner' || msg.member.roles.find(r => r.name === 'Moderator')) || msg.member.roles.find(r => r.name === 'Admins')){
                serverIP = msg.content.split(" ")[1];
                msg.reply("server IP set to " + serverIP);
            }


            //ServerIP
        } else if (serverIPCommand.test(msg.content)) {
            msg.reply(serverIP);
        }
    }

});

client.login(token);