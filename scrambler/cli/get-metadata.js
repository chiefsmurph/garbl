const { promisify } = require('util');
const ffmpeg = require("fluent-ffmpeg");
const ffprobe = promisify(ffmpeg.ffprobe);

(async () => {
    const file = process.argv[2];
    console.log({ file });
    console.log(await ffprobe(file))
})();