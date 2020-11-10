const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmetadata = require("ffmetadata");
const { stringObj, getDuration, cutAtTime, getBaseFileName } = require('./utils');

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
    } while (returnArr.some(tooClose));
    console.log(`done in ${count}`);
    return returnArr.map(({ index, ...obj }) => obj);
}

const scrambleMp3 = async (input, clipDuration = 0.1, overlapRatio = 2) => {
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

    const outputFile = `./outputs/${getBaseFileName(input)}-scrambled.mp3`;
    await mergeFiles(
        newOrder.map(output => output.outputFile), 
        outputFile
    );

    const allTimestamps = newOrder.map(output => output.timestamp);
    const timestampOrder = [...allTimestamps]
        .sort((a, b) => a - b)
        .map(timestamp => allTimestamps.indexOf(timestamp));
    const metadata = { timestampOrder, clipDuration, overlapRatio };
    console.log({ metadata })
    await new Promise(resolve =>
        ffmetadata.write(outputFile, {
            artist: 'mp3scrambler', 
            comment: stringObj(metadata) 
        }, err => {
            console.log({ err });
            resolve();
        })
    );
    
    console.log('now clearing temp');
    for (let file of newOrder) {
        fs.unlinkSync(file.outputFile);
    }

    return {
        outputFile,
        timestampOrder,
    };
};

module.exports = scrambleMp3;