class InputCommand{
    constructor(name, prefix, fun){
        this.regex = new RegExp(prefix + name + ' .+');
        this.runFunction = fun;
    }

    onCall(msg){ this.runFunction(msg); }
    getRegex(){ return this.regex; }
}

module.exports = InputCommand;