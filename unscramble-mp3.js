const fs = require('fs');
const ffmetadata = require("ffmetadata");
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const { getDuration, cutAtTime, getBaseFileName } = require('./utils/audio');
const { parseObj } = require('./utils/string-parsing');

const mergeFilesWithCrossFade = async (filesArray, crossFadeDuration, outputFile) => {
    // filesArray = filesArray.slice(0, 8);
    console.log(`merging ${filesArray.length} mp3s`);
    const filterString = filesArray.slice(0, -1).map((_, i) => 
        `[${i === 0 ? i : `a${i}`}][${i+1}]acrossfade=d=${crossFadeDuration}:c1=tri:c2=tri${i === filesArray.length - 2 ? '' : `[a${i+1}]`}`
    );
    const args = [
        ...filesArray.map(file => `-i ${file}`),
        '-vn',
        `-filter_complex "${filterString.join(';')}"`,
        '-write_xing 0',
        outputFile
    ];

    const cmd = `ffmpeg ${args.join(' ')}`;
    console.log(cmd);
    await exec(cmd);
};

const unscrambleMp3 = async input => {
    if (!input) {
        return console.error('no input defined');
    }

    console.log(`unscrambling ${input}`);
    const duration = await getDuration(input);
    const outputs = [];

    let timestampOrder, clipDuration, overlapRatio;
    try {
        const metadata = await promisify(ffmetadata.read)(input);
        const parsedComment = parseObj(metadata.comment);
        ({ timestampOrder, clipDuration, overlapRatio } = parsedComment);
    } catch (e) {
        return console.error(`unable to unscramble ${input}: ${e.toString()}`);
    }

    console.log({
        clipDuration,
        overlapRatio,
        timestampOrder,
    });

    const totalChunkLength = clipDuration * overlapRatio;
    for (let i = 0; i < duration; i = +(i + totalChunkLength).toFixed(4)) {
        try {
            const { outputFile, stdout, stderr } = await cutAtTime(input, i, totalChunkLength);
            outputs.push({ outputFile, timestamp: i });
            console.log(`finished cutting ${i} / ${duration}`)
        } catch (e) {
            console.error('no big', e);
        }
    }
    
    const unscrambleFileOrder = timestampOrder.map(index => {
        return outputs[index].outputFile;
    });

    const outputFile = `./outputs/${getBaseFileName(input)}-unscrambled.mp3`;
    try { fs.unlinkSync(outputFile); } catch (e) {}
    await mergeFilesWithCrossFade(
        unscrambleFileOrder,
        +((clipDuration * overlapRatio) - clipDuration).toFixed(4),
        outputFile
    );

    console.log('now clearing temp');
    for (let file of unscrambleFileOrder) {
        fs.unlinkSync(file);
    }
    
    return { outputFile };
}

module.exports = unscrambleMp3;