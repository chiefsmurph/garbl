const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const { write, read } = require('../utils/metadata');
const { getDuration, cutAtTime, getBaseFileName } = require('../utils/audio');
const { stringObj, parseObj } = require('../utils/string-parsing');

const mergeFiles = (filesArray, outputFile) =>
    new Promise(resolve => {
        console.log(`merging ${filesArray.length} files`);
        const cmd = ffmpeg();
        for (let file of filesArray) {
            cmd.input(file);
        }
        cmd
            .on('end', () => {
                console.log(`done merging to ${outputFile}`)
                resolve();
            })
            .mergeToFile(outputFile);
    });

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

const singleScramble = async ({
    input,
    output,
    clipDuration = 0.1,
    overlapRatio = 2
}) => {

    if (!input) {
        return console.error('no input defined');
    }

    output = output || `./outputs/${getBaseFileName(input)}-scrambled.mp3`;

    const duration = await getDuration(input);
    console.log({ duration });
    const outputs = [];
    for (let i = 0; i < duration - clipDuration; i = +(i + clipDuration).toFixed(4)) {
        try {
            const { outputFile, stdout, stderr } = await cutAtTime(input, i, clipDuration * overlapRatio);
            outputs.push({ outputFile, timestamp: i });
            console.log(`finished cutting ${i} / ${duration}`)
        } catch (e) {
            console.error('no big', e);
        }
    }

    const lastOutput = outputs.pop();
    const newOrder = realScramble(outputs);
    newOrder.push(lastOutput);

    console.log({ newOrder })

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
            artist: 'mp3scrambler', 
            comment: stringObj(newComment) 
        }
    );

    console.log('now clearing temp');
    for (let file of newOrder) {
        console.log({ file: file.outputFile });
        fs.unlinkSync(file.outputFile);
    }

    return output;
};

const multiScramble = async ({
    input,
    output = `outputs/${getBaseFileName(input)}-scrambled.mp3`
}) => {

    if (!input) {
        return console.error('no input defined');
    }

    const settings = [
        {
            clipDuration: 0.1, 
            overlapRatio: 2
        },
        {
            clipDuration: 0.3, 
            overlapRatio: 1.5
        },
        // {
        //     clipDuration: 0.1, 
        //     overlapRatio: 2
        // },
    ];

    let curInput = input;
    let index = 1;
    for (let { clipDuration, overlapRatio } of settings) {
        console.log(`starting ${index} of ${settings.length}`);
        const output = `./temp/${getBaseFileName(input)}-scrambled-${index}.mp3`;
        await singleScramble({
            input: curInput,
            output,
            clipDuration,
            overlapRatio
        });
        console.log(`done with ${index} of ${settings.length}`);
        curInput = output;
        index++;
    }
    
    console.log(
        'renaming', curInput.slice(2), `outputs/${getBaseFileName(input)}-scrambled.mp3`
    );
    await fs.renameSync(curInput.slice(2), output);
    return output;

};

module.exports = multiScramble;