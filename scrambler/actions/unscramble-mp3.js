const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const { read } = require('../utils/metadata');
const { getDuration, cutAtTime, getBaseFileName } = require('../utils/audio');
const { parseObj } = require('../utils/string-parsing');

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

const unscrambleSingle = async ({
    input,
    output,
    clipDuration,
    overlapRatio,
    timestampOrder
}) => {
    
    output = output || `./outputs/${getBaseFileName(input)}-unscrambled.mp3`;

    const duration = await getDuration(input);
    console.log({
        input,
        output,
        clipDuration,
        overlapRatio,
        timestampOrder
    });

    let outputs = [];
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

    try { fs.unlinkSync(output); } catch (e) {}
    await mergeFilesWithCrossFade(
        unscrambleFileOrder,
        +((clipDuration * overlapRatio) - clipDuration).toFixed(4),
        output
    );

    console.log('now clearing temp');
    for (let file of unscrambleFileOrder) {
        console.log({ file })
        fs.unlinkSync(file);
    }
    
    return output;
};

const unscrambleMp3 = async input => {
    if (!input) {
        return console.error('no input defined');
    }

    console.log(`unscrambling ${input}`);

    let conversions;
    try {
        const metadata = await read(input);
        console.log({ metadata })
        const parsedComment = parseObj(metadata.comment);
        const validScrambleMp3 = parsedComment && Array.isArray(parsedComment);
        console.log({ parsedComment, validScrambleMp3 })
        if (!validScrambleMp3) throw new Error();
        conversions = parsedComment;
    } catch (e) {
        return console.error(`unable to unscramble ${input}: ${e.toString()}`);
    }

    let curInput = input;
    let index = 1;
    for (let conversion of conversions.reverse()) {

        console.log(`starting ${index} of ${conversions.length}`);
        const output = `./temp/${getBaseFileName(input)}-unscrambled-${index}.mp3`;

        lastOutput = await unscrambleSingle({
            input: curInput,
            output,
            ...conversion
        });

        console.log(`done with ${index} of ${conversions.length}`);
        curInput = output;
        index++;

    }

    console.log(
        'renaming', curInput.slice(2), `outputs/${getBaseFileName(input)}-unscrambled.mp3`
    );
    await fs.renameSync(curInput.slice(2), `outputs/${getBaseFileName(input)}-unscrambled.mp3`);
    return `outputs/${getBaseFileName(input)}-scrambled.mp3`;
}

module.exports = unscrambleMp3;