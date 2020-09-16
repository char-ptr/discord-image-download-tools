const request = require('request');
const { exit } = require('process');
const fs = require('fs')

let [file,location,name] = process.argv.splice(2)

if (! file || ! location) return;
console.log(location,name)

let writeStream = fs.createWriteStream(location+'\\'+name)


request.get(file)
    .on('error',console.log)
    .pipe(writeStream)
    .on('finish', (a) => {console.log('Done');writeStream.close();})