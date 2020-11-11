const { promisify } = require('util');

const path = require('path');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cors = require("cors");

const port = 3008;
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
app.use(fileUpload());

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


app.post('/upload', async (req, res, next) => {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const { audioFile } = req.files;
  const { name } = audioFile;

  console.log({ audioFile });
  await promisify(audioFile.mv)(`../scrambler/inputs/${name}`);
  res.send(200);

});

app.post('/act', async (req, res, next) => {
  console.log("act body", req, req.body);
  const { action, file } = JSON.parse(Object.keys(req.body)[0]);
  const fn = action === 'scramble' ? scrambleMp3 : unscrambleMp3;
  const input = `../scrambler/inputs/${file}`;
  console.log({ input });
  try {
    const output = await fn({ input });
    console.log({ output });
    const finalOut = output.split('/').pop();
    res.send({ output: finalOut });
  } catch (e) {
    console.error(e);
    res.error(e);
  }
});

app.use(express.static(path.join(__dirname, '../client/build')));