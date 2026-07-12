const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const { write, read } = require('../utils/metadata');
const { getDuration, cutAtTime, cutAtTimeWav, getBaseFileName } = require('../utils/audio');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { stringObj, parseObj } = require('../utils/string-parsing');
const { saveMetadata } = require('../utils/fingerprint');

const MERGE_BATCH_SIZE = 200;

const mergeBatchViaConcat = async (filesArray, outputFile) => {
    const inputs = filesArray.map(f => `-i "${f}"`).join(' ');
    const filterIn = filesArray.map((_, i) => `[${i}:a]`).join('');
    const filterComplex = `${filterIn}concat=n=${filesArray.length}:v=0:a=1[out]`;
    const cmd = `ffmpeg ${inputs} -filter_complex "${filterComplex}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 -y "${outputFile}"`;
    await exec(cmd);
};

const mergeFiles = async (filesArray, outputFile) => {
    console.log(`merging ${filesArray.length} files`);
    if (filesArray.length <= MERGE_BATCH_SIZE) {
        await mergeBatchViaConcat(filesArray, outputFile);
        console.log(`done merging to ${outputFile}`);
        return;
    }
    const tmpDir = path.join(__dirname, '../temp');
    const batches = [];
    for (let i = 0; i < filesArray.length; i += MERGE_BATCH_SIZE) {
        batches.push(filesArray.slice(i, i + MERGE_BATCH_SIZE));
    }
    const batchOutputs = [];
    for (let i = 0; i < batches.length; i++) {
        const batchOut = path.join(tmpDir, `_batch_${Date.now()}_${i}.wav`);
        console.log(`merging batch ${i + 1}/${batches.length}`);
        const inputs = batches[i].map(f => `-i "${f}"`).join(' ');
        const filterIn = batches[i].map((_, j) => `[${j}:a]`).join('');
        const filterComplex = `${filterIn}concat=n=${batches[i].length}:v=0:a=1[out]`;
        await exec(`ffmpeg ${inputs} -filter_complex "${filterComplex}" -map "[out]" -y "${batchOut}"`);
        batchOutputs.push(batchOut);
    }
    await mergeFiles(batchOutputs, outputFile);
    for (const f of batchOutputs) {
        try { fs.unlinkSync(f); } catch (_) {}
    }
    console.log(`done merging to ${outputFile}`);
};

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
    
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    
    return array;
}

const realScramble = array => {
    let returnArr = [...array.map((v, index) => ({ ...v, index }))];
    console.log({ returnArr });
    const tooClose = (v, i, arr) => {
        // const prev = arr[i-1];
        // const next = arr[i+1];
        const bufferAmt = 3;
        const considerations = [
            ...arr.slice(i - bufferAmt, i),
            ...arr.slice(i + 1, i + bufferAmt)
        ];
        // console.log({ considerations, v })
        return considerations.filter(Boolean).some((val, i) => {
            const notGood = Math.abs(v.index - val.index) < 3;
            // if (notGood) {
            //     console.log({
            //         notGood: {
            //             index: val.index,
            //             i
            //         },
            //     });
            // }
            return notGood;
        });
    };
    let count = 0;
    do {
        count++;
        returnArr = shuffle([...returnArr]).sort(() => .5 - Math.random());
    } while (returnArr.some(tooClose) && count < 100);
    console.log(`done in ${count}`);
    return returnArr.map(({ index, ...obj }) => obj);
}


const fixFirstChunkDuration = (file) => {

};


const singleScramble = async ({
    input,
    output = path.join(__dirname, `../outputs/${getBaseFileName(input)}-scrambled.wav`),
    clipDuration = 0.1,
    overlapRatio = 2,
    isYoutube = false,
}) => {

    if (!input) {
        return console.error('no input defined');
    }

    // Convert input to WAV for sample-accurate cutting (MP3 fast-seek can be off by ~26ms per cut)
    let sourceFile = input;
    let tempSourceWav = null;
    if (!input.toLowerCase().endsWith('.wav')) {
        tempSourceWav = path.join(__dirname, `../temp/${getBaseFileName(input)}_src.wav`);
        await exec(`ffmpeg -i "${input}" -ac 2 -ar 44100 -y "${tempSourceWav}"`);
        sourceFile = tempSourceWav;
        console.log(`converted input to WAV for accurate cutting: ${sourceFile}`);
    }

    const duration = await getDuration(sourceFile);
    console.log({ duration });
    const outputs = [];
    for (let i = 0; i < duration - clipDuration; i = +(i + clipDuration).toFixed(4)) {
        try {
            const { outputFile, stdout, stderr } = await cutAtTimeWav(sourceFile, i, clipDuration * overlapRatio);
            outputs.push({ outputFile, timestamp: i });
            console.log(`finished cutting ${i} / ${duration}`)
        } catch (e) {
            console.error('no big', e);
        }
    }

    const newOrder = isYoutube 
        ? [...outputs].reverse() 
        : (() => {
            const lastOutput = outputs.pop();
            const newOrder = realScramble(outputs);
            newOrder.push(lastOutput);
            return newOrder;
        })();

    console.log({ isYoutube, newOrder });


    console.log(
        'chunk durations',
        await Promise.all(
            newOrder
                .map(output => output.outputFile)
                .map((file, index) => getDuration(file))
        )
    )


    await mergeFiles(
        newOrder.map(output => output.outputFile), 
        output
    );

    const allTimestamps = newOrder.map(output => output.timestamp);
    const timestampOrder = [...allTimestamps]
        .sort((a, b) => a - b)
        .map(timestamp => allTimestamps.indexOf(timestamp));
    const metadata = { timestampOrder, clipDuration, overlapRatio };
    console.log({ metadata });

    const currentMetadata = await read(output);
    console.log({ currentMetadata});
    const newComment = [
        ...currentMetadata?.comment ? parseObj(currentMetadata.comment) : [],
        metadata,
    ];

 
    await write(
        output,
        {
            artist: 'garbl',
            comment: stringObj(newComment)
        }
    );
    saveMetadata(output, newComment);

    if (tempSourceWav) {
        try { fs.unlinkSync(tempSourceWav); } catch (_) {}
    }

    console.log('now clearing temp');
    // for (let file of newOrder) {
    //     console.log({ file: file.outputFile });
    //     fs.unlinkSync(file.outputFile);
    // }

    return output;
};

const multiScramble = async ({
    input,
    output = path.join(__dirname, `../outputs/${getBaseFileName(input)}-scrambled.wav`),
}) => {

    if (!input) {
        return console.error('no input defined');
    }

    const settings = [
        {
            clipDuration: 0.05,
            overlapRatio: 1
        },
        // {
        //     clipDuration: 0.3, 
        //     overlapRatio: 1.5
        // },
        // {
        //     clipDuration: 0.1, 
        //     overlapRatio: 2
        // },
    ];

    let curInput = input;
    let index = 1;
    for (let setting of settings) {
        console.log(`starting ${index} of ${settings.length}`);
        const output = path.join(__dirname, `../temp/${getBaseFileName(input)}-scrambled.wav`);
        await singleScramble({
            input: curInput,
            output,
            ...setting,
            // isYoutube: true
        });
        console.log(`done with ${index} of ${settings.length}`);
        curInput = output;
        index++;
    }
    
    console.log('renaming', input, output);
    await fs.renameSync(curInput, output);
    return output;

};

module.exports = multiScramble;