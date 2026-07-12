const path = require('path');
const ffmpeg = require("fluent-ffmpeg");
const { promisify } = require('util');
const ffprobe = promisify(ffmpeg.ffprobe);

// audio
const getDuration = async file => {
    try {
        return (await ffprobe(file)).format.duration;
    } catch (e) {
        return null;
    }
}
    

const getBaseFileName = file => file.split('.').slice(0, -1).join('').split('/').pop();

const cutAtTime = (file, timestamp, duration = 1) =>
    new Promise(resolve => {
        const outputFile = path.join(__dirname, `../temp/${getBaseFileName(file)}-${timestamp}.mp3`);
        ffmpeg(file)
            .setStartTime(timestamp)
            .duration(duration)
            .audioChannels(2)
            .on('end', (stdout, stderr) => resolve({ stdout, stderr, outputFile }))
            .saveToFile(outputFile)
    });

const cutAtTimeWav = (file, timestamp, duration = 1) =>
    new Promise(resolve => {
        const outputFile = path.join(__dirname, `../temp/${getBaseFileName(file)}-${timestamp}.wav`);
        ffmpeg(file)
            .setStartTime(timestamp)
            .duration(duration)
            .audioChannels(2)
            .audioFrequency(44100)
            .on('end', (stdout, stderr) => resolve({ stdout, stderr, outputFile }))
            .saveToFile(outputFile)
    });


module.exports = {
    getDuration,
    getBaseFileName,
    cutAtTime,
    cutAtTimeWav
};