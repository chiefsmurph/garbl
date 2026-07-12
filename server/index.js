const socketIOClient = require('socket.io-client');
const { rhEndpoint, options } = require('./config');

const { promisify } = require('util');

const exec = promisify(require('child_process').exec);
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

app.get('/inputs/:id', function(req, res){
  const file = path.join(__dirname, `../scrambler/inputs/${req.params.id}`);
  res.download(file); // Set disposition and send it.
});

const fileUpload = require('express-fileupload');
const blobToMp3 = require('../scrambler/utils/blob-to-mp3');
const { getDuration } = require('../scrambler/utils/audio');
const MAX_DURATION_SECONDS = 60;
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
rhSocket.emit('client:act', 'log', `garbl: hello`);

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
  const { forceName } = req.body;
  const name = forceName || audioFile.name;
  console.log({ name, forceName });
  rhSocket.emit('client:act', 'log', `garbl: upload ${name}`, userInfo(req));

  console.log({ audioFile });

  const movePath = `../scrambler/inputs/${name}`;
  await promisify(audioFile.mv)(movePath);


  if (forceName) {
    console.log('gotta do this');
    // if blob upload then convert to mp3
    await blobToMp3(movePath);
  }

  const duration = await getDuration(movePath);
  if (duration && duration > MAX_DURATION_SECONDS) {
    fs.unlinkSync(movePath);
    return res.status(400).send(`File too long (${Math.round(duration)}s). Maximum is ${MAX_DURATION_SECONDS} seconds.`);
  }

  res.sendStatus(200);

});


const statuses = {};
const countsPath = path.join(__dirname, 'counts.json');
const counts = fs.existsSync(countsPath)
  ? JSON.parse(fs.readFileSync(countsPath, 'utf8'))
  : { scrambles: 0, unscrambles: 0 };
const saveCounts = () => fs.writeFileSync(countsPath, JSON.stringify(counts));

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
    if (action === 'scramble') counts.scrambles++;
    else counts.unscrambles++;
    saveCounts();
  } catch (e) {
    statuses[key] = { error: `an error occurred trying to ${action} the audio` };
    console.error(e);
  }
}

app.post('/act', async (req, res, next) => {
  console.log("act body", req, req.body);
  const { action, file } = JSON.parse(Object.keys(req.body)[0]);
  rhSocket.emit('client:act', 'log', `garbl: new task: ${action} ${file}`, userInfo(req));
  newTask(file, action);
  res.sendStatus(200);
});

app.get('/stats', (req, res) => res.json(counts));

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
app.use('/outputs', express.static(path.join(__dirname, '../scrambler/outputs')));
app.use('/inputs', express.static(path.join(__dirname, '../scrambler/inputs')));
app.use('/', express.static(clientPath));