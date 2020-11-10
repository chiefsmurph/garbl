const scrambleMp3 = require('./scramble-mp3');
const unscrambleMp3 = require('./unscramble-mp3');

(async () => {

    const input = './inputs/test-audio-2.mp3';
    const clipDuration = 0.1;

    console.log('scrambling mp3');
    const { outputFile: scrambledFile } = await scrambleMp3(input, clipDuration, 2);

    console.log('unscrambling mp3');
    const { outputFile: unscrambledFile } = await unscrambleMp3(scrambledFile);

    console.log('done', {
        input,
        scrambledFile,
        unscrambledFile
    });

})();

