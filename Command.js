class Command{
    constructor(name, prefix, fun){
        this.regex = new RegExp(prefix + name);
        this.runFunction = fun;
    }

    onCall(msg){ this.runFunction(msg); }
    getRegex(){
        console.log(this.regex);return this.regex; }
}



module.exports = Command;