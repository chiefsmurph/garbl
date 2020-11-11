const scrambleMp3 = require('./scrambler/actions/scramble-mp3');
const unscrambleMp3 = require('./scrambler/actions/unscramble-mp3');

(async () => {

    const input = './inputs/words.mp3';
    const clipDuration = 0.1;

    console.log('scrambling mp3');
    const scrambledFile = await scrambleMp3({
        input, 
        clipDuration: 0.1,
        overlapRatio: 2 
    });

    console.log('unscrambling mp3');
    const unscrambledFile = await unscrambleMp3(scrambledFile);

    console.log('done', {
        input,
        scrambledFile,
        unscrambledFile
    });

})();

