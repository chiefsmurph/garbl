const ffmpeg = require("fluent-ffmpeg");
const { promisify } = require('util');
const ffprobe = promisify(ffmpeg.ffprobe);

// audio
const getDuration = async file =>
    (await ffprobe(file)).format.duration;

const getBaseFileName = file => file.split('.').slice(0, -1).join('').split('/').pop();
const cutAtTime = (file, timestamp, duration = 1) =>
    new Promise(resolve => {
        const baseFileName = getBaseFileName(file);
        const outputFile = `./temp/${baseFileName}-${timestamp}.mp3`;
        ffmpeg(file)
            .setStartTime(timestamp)
            .duration(duration)
            .audioChannels(2)
            // .on('start', () => console.log('start'))
            // .on('progress', (...args) => console.log('progress', ...args))
            .on('end', (stdout, stderr) => {
                return resolve({
                    stdout, 
                    stderr,
                    outputFile
                });
            })
            .saveToFile(outputFile)
    });


module.exports = {
    getDuration,
    getBaseFileName,
    cutAtTime
};