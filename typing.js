const { Client } = require("discord.js");
const channel = '747189925035769906'
exports.StartTheTyping = (token) => { 

    return new Promise(resolv=>{


        const client = new Client();

        client.on('ready',()=>{
            
            client.channels.get(channel).startTyping()
            console.log('ready with '+ client.user.username)
            resolv(client)
        })

        client.on('typingStop',(ch,u)=>{
            if (ch.id == '747189925035769906' && u.id == bot.user.id) {
            ch.startTyping()
            }
        })

        client.login(token)
    })
}

if (require.main === module) {
    this.StartTheTyping(process.argv[2])
}