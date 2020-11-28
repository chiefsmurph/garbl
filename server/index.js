const socketIOClient = require('socket.io-client');
const { rhEndpoint, options } = require('./config');

const { promisify } = require('util');

const exec = promisify(require('child_process').exec);
const youtubedl = require('youtube-dl')
const fs = require('fs')

const path = require('path');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cors = require("cors");

const port = 3009;
const server = app.listen(port, () => {
  console.log('connected to port: '+ port)
});

const scrambleMp3 = require('../scrambler/actions/scramble-mp3');
const unscrambleMp3 = require('../scrambler/actions/unscramble-mp3');

app.options('*', cors()); 
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-  With, Content-Type, Accept");
    next();
});

// app.use('/outputs', express.static());

app.get('/outputs/:id', function(req, res){
  const file = path.join(__dirname, `../scrambler/outputs/${req.params.id}`);
  res.download(file); // Set disposition and send it.
});

const fileUpload = require('express-fileupload');
app.use(fileUpload({
  // limits: { fileSize: 50 * 1024 * 1024 },
  // safeFileNames: true,
  useTempFiles: true
}));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const rhSocket = socketIOClient(rhEndpoint, options);
rhSocket.on('connect', () => {
  console.log('connection')
})
rhSocket.emit('client:act', 'log', `mp3scrambler: hello`);

const userInfo = req => {
  const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0]
  const userAgent = req.headers['user-agent'];
  return { ip, userAgent };
}

app.post('/upload', async (req, res, next) => {


  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const { audioFile } = req.files;
  const { name } = audioFile;

  rhSocket.emit('client:act', 'log', `mp3scrambler: upload ${name}`, userInfo(req));

  console.log({ audioFile });
  await promisify(audioFile.mv)(`../scrambler/inputs/${name}`);
  res.send(200);

});

app.post('/fetch', async (req, res, next) => {


  try {
    const { url } = req.body;
    console.log({ fetching: url });
  
  
    const info = await promisify(youtubedl.getInfo)(url);
    console.log({ info });
    
    const cmd = `youtube-dl -o "${path.join(__dirname, `../scrambler/inputs/`)}%(title)s.%(ext)s" --extract-audio --audio-format=mp3 --audio-quality=0 ${url}`;
  
    rhSocket.emit('client:act', 'log', `mp3scrambler: fetching ${url}: ${info.fulltitle}`, userInfo(req));

    const output = await exec(cmd);
    console.log({ output })
    return res.send({ file: info.fulltitle + '.mp3' })
  
    // const info = await promisify(youtube.getInfo)(url);
    // console.log({ info });
  
    // const info = await promisify(youtubedl.getInfo)(url);
    // const { _filename } = info;
    //   // if (err) throw err
     
    // console.log('id:', info.id)
    // console.log('title:', info.title)
    // console.log('url:', info.url)
    // console.log('thumbnail:', info.thumbnail)
    // console.log('description:', info.description)
    // console.log('filename:', info._filename)
    // console.log('format id:', info.format_id);
  
    // const video = youtubedl(url, [
    //   // '-i', 
    //   '--extract-audio', '--audio-format=mp3', '--audio-quality=0'
    // ]);
  
    // // Will be called when the download starts.
    // video.on('info', function(info) {
    //   console.log('Download started')
    //   console.log('filename: ' + info._filename)
    //   console.log('size: ' + info.size)
    // });
    
    // video.pipe(fs.createWriteStream(`../scrambler/inputs/${'couch' || _filename.split('.')[0]}.mp3`));
  
  
    // // Will be called if download was already completed and there is nothing more to download.
    // video.on('complete', function complete(info) {
    //   'use strict'
    //   console.log('filename: ' + info._filename + ' already downloaded.')
    // })
    
    // video.on('end', function() {
    //   console.log('finished downloading!')
    // })
  
    // youtubedl
  } catch (e) {
    console.error(e);
    setTimeout(() => {
      console.log('there was an error')
      res.send(500);
    }, 1500);
  }
  
});

const statuses = {};

const newTask = async (file, action) => {
  const fn = action === 'scramble' ? scrambleMp3 : unscrambleMp3;
  const input = `../scrambler/inputs/${file}`;
  const key = [file, action].join('-');
  console.log({ input });
  try {
    statuses[key] = { status: `current ${action} in progress` };
    const output = await fn({ input });
    const finalOut = output.split('/').pop();
    statuses[key] = { result: `${action} was successful`, output: finalOut };
  } catch (e) {
    statuses[key] = { error: `an error occurred trying to ${action} the audio` };
    console.error(e);
  }
}

app.post('/act', async (req, res, next) => {
  console.log("act body", req, req.body);
  const { action, file } = JSON.parse(Object.keys(req.body)[0]);
  rhSocket.emit('client:act', 'log', `mp3scrambler: new task: ${action} ${file}`, userInfo(req));
  newTask(file, action);
  res.send(200);
});

app.get('/status', (req, res) => {
  const { file, action } = req.query;
  const key = [file, action].join('-');
  console.log({ file, action, key });
  res.send(
    statuses[key]
  );
});


const clientPath = path.join(__dirname, '../client/build');
console.log({ clientPath });
app.use(express.static(clientPath));