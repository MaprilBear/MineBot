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
        /*
        var prom = new Promise(function newFunction(resolve, reject) {
            var result = fun(msg);
            resolve(result);
        });
        prom.then(function (value) {
            console.log(value)
        });

         */
    }

    getRegex(prefix){ return RegExp(prefix + this.regex.source); }
}



module.exports = Command;