const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = async file => {
    const { stderr } = await exec(`ffmpeg -i "${file}" "${file}.mp3"`);
    fs.unlinkSync(file);
    console.log({ stderr})
};