const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require('fs')
const request = require('request');
const readline = require('readline')
const { clearInterval } = require("timers");
const { EventEmitter } = require( 'events');
const path = require("path");
const pref = ';'

const {token, DownloadUrl, DefaultCID, anime} = require('./config')

const hentaiPath = path.join(DownloadUrl, '/Hentai')
const AnimePath = path.join(DownloadUrl, '/Anime')

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

if (!fs.existsSync('./hData.json')){
  fs.appendFileSync('./hData.json',JSON.stringify({Normal:[],Yuri:[]},null,4))
}

let currentData = JSON.parse(fs.readFileSync('./hData.json').toString('utf8'))

// console.log(currentData)

rl.pause

class ProgressBar {

  Length = 0
  Event = new EventEmitter();
  completed = false;
  Progress = 0;
  constructor(len) {

    this.Length = len;
      

  }

  RenderUpdate(now,msg) {
    if (this.completed) return;
    let Perc = Math.floor((now / this.Length) * 100)
    let Amount = Math.floor((now / this.Length)*20 )

    process.stdout.write(`${msg ? msg + '\n' : ''}${Perc}% [${'='.repeat(Amount)}${Amount != 20? '>' : ''}${Amount != 20? ' '.repeat(19-Amount)  : ''}] ${Math.floor(now)}/${Math.floor(this.Length)} ${Amount != 20? '\r' : '\n'}`)

    this.process = Perc;
    if (Perc === 100) {this.Event.emit('Finish',true);this.completed = true;}
    else {this.Event.emit('Update', Perc)}

  }

  Close() {
    process.stdout.write('\n')
    this.Event.emit('Finish',true);
    this.completed = true;

  }

  Render() {

    process.stdout.write(`0% [${' '.repeat(20)}] 0/${this.Length}\r`)

  }

}

let currentChannel = ''

const DownloadAllAttachmentsFromMessage = async (msg,dir) => {

  let c = 0;

  let reg = /(([A-Za-z]|\D)\d{0,2})*/

  let spliiteddir = dir.split(/(\/|\\)/)

  for (let attch of msg.attachments.map(v => v))
  {
    if (!attch ||!attch.url) continue;

    let files = fs.readdirSync(dir)

    let Extention = attch.filename.slice(attch.filename.lastIndexOf('.'));
    
    let writingName = `${files.length}_${attch.filename.match(reg) ? attch.filename.match(reg)[0] : 'UNKNOWN'}#${spliiteddir[spliiteddir.length-1]}${Extention}`


    let writeStream = fs.createWriteStream(`${dir}/${writingName}`)

    await (async () => {
      let now = new Date()
      console.log('Doing '+ writingName)

      let invt = setInterval(()=>{

        pb.RenderUpdate(writeStream.bytesWritten)

      },1e1)

      let pb = new ProgressBar(attch.filesize)
      pb.Render()

      return new Promise(resolve => {
        try {
        request.get(attch.url)
          .on('error',console.log)
          .pipe(writeStream)
          .on('finish', (a) => {clearInterval(invt); pb.RenderUpdate(attch.filesize) ;console.log(`>Completed in ${(new Date() - now)/1000}s ${writingName} --- ${msg.id}\n\n`);c++; resolve(''); writeStream.close();})
        } catch (e){
          pb.RenderUpdate(attch.filesize)
          console.log(`>Completed (Due to fail) in ${(new Date() - now)/1000}s ${writingName}\n\n`)
          resolve()
          writeStream.close()
        }
      })
    })()
  }

  return c
}

const commands = 
{

  get: async ([channel=DefaultCID,before,limit, type,location]) => 
  {

    console.log(`Channel:${channel}\nBefore:${before}\nLimit:${limit}\nLocation:${location}`)

    let dir = path.join(type.toLowerCase() == 'h'? hentaiPath : AnimePath,'/'+ location)
    if (!fs.existsSync(dir)) 
    fs.mkdirSync(dir)

    let lastM = before;
    let count = 0;
    let channelv = bot.channels.get(channel)
    console.log(channel)
    while  (count<limit) {

      let c = await channelv.fetchMessages({before:lastM,limit:Math.max((limit - count),1) % 100 });

      if (!c || count>=limit) break;

      for await (let mapped of c) 
      { 
        msg = mapped[1]
        let out =  await DownloadAllAttachmentsFromMessage(msg,dir)
        count += out
  
      }

      lastM = c.lastKey();
    }
    console.log(`Last fetched message : ${lastM}`)
    
    console.log(`Completed stealing! (${count} images)`)

  },
  postH : async (args) => {


    currentChannel = args[0]
    
    c = bot.channels.get(currentChannel)
    if (!c) currentChannel = '';
    let files = currentData['Normal']

    seen = []

    return new Promise(async resol => {

      resol('h')

      while (currentChannel != '' || currentChannel) {

        farr = files.filter(v=>!seen.includes(v))


		let f = files[Math.floor(Math.random() * farr.length)]
        if (!farr || farr == []) break;
		try {
			await c.send({files:[DIR+'/'+f]})
		}catch(e) {}

      }
      console.log('Stopped')
    })


  },
  stopP : async (args) => {

    currentChannel = '';

  },
  eval : async (args) => {

    const clean = text => {
      if (typeof(text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
      else
          return text;
    }

    try {
      const code = args.join(" ");
      let evaled = eval(code);
 
      if (typeof evaled !== "string")
        evaled = require("util").inspect(evaled);
 
      console.log(clean(evaled));
    } catch (err) {
      console.log(`ERROR\n${clean(err)}\n`);
    }


  },
  setNN : async() =>{

    guild = bot.guilds.get('744411529725870123')
    let sacredText = '឵឵឵   ឵឵឵   ឵឵឵   ឵឵឵'
    guild.fetchMembers(undefined,guild.memberCount)
    for (let i in guild.members.array()) {
      let v = guild.members.array()[i]
      if (v.manageable && v.nickname != sacredText) {
        await v.setNickname(sacredText,'sacredText')
        console.log(`did  ${v.user.username} (${v.nickname}) ${i}/${guild.members.array().length}`)
        
      } else console.log(`skipping ${v.user.username} (${v.nickname}) ${i}/${guild.members.array().length}`)
    }

  },
  test : async () => {


    const pb = new ProgressBar(20);

    console.log(pb)

    pb.Render()


    (()=>{

      let c = 0;

      let invt = setInterval(()=>{

        if (c >= 20) clearInterval(invt)

        pb.RenderUpdate(c);
        c++;

      },1e3)

    })()

  },
  SetStatus: async (args) => {

    bot.user.setStatus(args[0])


  },

  writeData: async ([channel,before,type,amount])=>{

    let ch = bot.channels.get(channel)
    let count = 0;
    let lastM = before;
    let ar = []
    while  (count<amount) {

      let c = await ch.fetchMessages({before:lastM,limit: Math.max((amount - count),1) % 100 });

      if (!c || count>=amount) break;
      for await (let mapped of c) 
      { 
        msg = mapped[1]
        let out =  msg.attachments.map(v=>v.url)
        ar = [
          ...ar,
          ...out
        ]
        count += out.length
  
      }
      console.log(`${count}/${amount}`)
      lastM = c.lastKey();
    }
    let found = ar.filter(r=> ! (currentData[type] ?? currentData['Normal']).includes(r))
    if (!currentData[type]) currentData[type] = []
    currentData[type] = [
      ...(currentData[type] ?? []),
      ...found
    ]
    fs.writeFileSync('./hData.json',JSON.stringify(currentData,null,4))
    console.log(`Successfully saved ${found.length} -- ${lastM}`)
  }
  


}


// const DetectionRegex = /[^"-~ ]/gm

bot.on("ready", async() => {
  console.log("on with "+ bot.user.username + ' \nDate :' + new Date())

  if (!fs.existsSync(DownloadUrl))  
    fs.mkdirSync(DownloadUrl)
  if (!fs.existsSync(hentaiPath)) 
    fs.mkdirSync(hentaiPath)
  if (!fs.existsSync(AnimePath)) 
    fs.mkdirSync(AnimePath)

    if (!fs.existsSync(path.join(AnimePath,'/Normal'))) 
      fs.mkdirSync(path.join(AnimePath,'/Normal'))

  if (!fs.existsSync(path.join(hentaiPath,'/Normal'))) 
    fs.mkdirSync(path.join(hentaiPath,'/Normal'))
  if (!fs.existsSync(path.join(hentaiPath,'/Yuri'))) 
    fs.mkdirSync(path.join(hentaiPath,'/Yuri'))


    // setInterval(() => {
    //   bot.channels.get('747189925035769906').startTyping()
    // }, 1e4);

  rl.resume()
  
  rl.on('line', async (line) => {
  
    let args = line.trim().split(/ +/g)
    const cmd = args[0]
    args = args.splice(1)
  
  
    let c = commands[cmd]
    // rl.pause()
    if (c) await c(args)
    // rl.resume();
    
  })
  // bot.fetchUser(sbot,true)
})

// bot.on('typingStop',(ch,u)=>{
//   if (ch.id == '747189925035769906' && u.id == bot.user.id) {
//     ch.startTyping()
//   }
// })

bot.on('error', e => console.log(`Caught error : ${e.message} (DiscordAPi)`));


bot.on('message',async msg => {

  // hanimetv auto downloads

  switch (msg.channel.id) {
    case ('681523355576303627') :
      DownloadAllAttachmentsFromMessage(msg,path.join(hentaiPath,'/Normal'))
      break;
    case ('681523619725443210') :
      DownloadAllAttachmentsFromMessage(msg,path.join(hentaiPath,'/Yuri'))
      break;
    case (anime ? '681523223724425369' : '') :
      DownloadAllAttachmentsFromMessage(msg,path.join(AnimePath,'/Normal'))
      break;
  }

  if (msg.channel?.guild?.id == '744411529725870123') {
    // msg.react('⭐')
/*     if (msg.author.id == '468812867194322945') {
      msg.channel.startTyping(Math.min(msg.content.length*1000,10e3))
      setTimeout(()=>{

        msg.channel.send(msg.content.replace('<@518763902570594314>',`<@${msg.author.id}>`).replace('@','\`@\`').replace('?','? '),{disableEveryone:true})

      },Math.max(Math.min(msg.content.length*100,10e3)),1e3)
    } */
  }
  

})
console.log('LOGGING IN')
bot.login(token)