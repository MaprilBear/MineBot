class Command{
    constructor(name, fun){
        this.regex = new RegExp(name);
        this.runFunction = fun;
    }

    onCall(msg) {

        this.runFunction(msg).then(function (result) {
            console.log(result);
            console.log()
        });
    }

    getRegex(prefix){ return RegExp(prefix + this.regex.source); }
}



module.exports = Command;