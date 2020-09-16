const { tokens } = require("./config");
const { StartTheTyping } = require("./typing");
const readline = require('readline')

let commands = {}


function completer(line) {
    const completions = Object.keys(commands)
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
  }

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer:completer,
    tabSize:4,
  });

(async()=>{

    let clients = []
    
    for (let token of tokens) {
        clients = [...clients,await StartTheTyping(token)]
    }
    
    commands = {
        send: ([chn,...msg])=>{
            for (let client of clients) {
                client.channels.get(chn).send(msg.join(' '))
            }
        } 
    }

    rl.on('line', async (line) => {
  
        let args = line.trim().split(/ +/g)
        const cmd = args[0]
        args = args.splice(1)
      
      
        let c = commands[cmd]
        // rl.pause()
        if (c) await c(args)
        // rl.resume();
        
      })

    console.log(clients.map(cli=>cli.user.username))
})()