const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const { read } = require('../utils/metadata');
const { getDuration, cutAtTime, getBaseFileName } = require('../utils/audio');
const { parseObj } = require('../utils/string-parsing');

const normalizeAudio = async file => {
    const { stderr } = await exec(`ffmpeg -i "${file}" -af "volumedetect" -vn -sn -dn -f null /dev/null`);
    console.log({ stderr })
    const line = stderr.split('\n').find(line => line.includes('max_volume: '));
    console.log({ line});
    const roomToAmp = Math.abs(Number(line.split('max_volume: ').pop().split(' dB')[0]));

    console.log({ roomToAmp });
    const cmd = `ffmpeg -i "${file}" -af "volume=${roomToAmp}dB" "${file}"`;
    console.log(cmd);
    const newFilename = `${file.split('/').slice(0, -1).join('/')}/${getBaseFileName(file)}-normalized.mp3`;
    const second = await exec(`ffmpeg -i "${file}" -af "volume=${roomToAmp}dB" -y "${newFilename}"`);

    await fs.renameSync(newFilename, file);
};

const mergeFilesWithCrossFade = async (filesArray, crossFadeDuration, outputFile) => {
    // filesArray = filesArray.slice(0, 8);
    console.log(`merging ${filesArray.length} mp3s`);


    console.log('checking files...');
    if (await getDuration(filesArray[0]) < 0.1) {
        filesArray.shift();
        console.log('shifted the first bit off because too short');
    }

    const filterString = filesArray.slice(0, -1).map((_, i) => 
        `[${i === 0 ? i : `a${i}`}][${i+1}]acrossfade=d=${crossFadeDuration}:c1=tri:c2=tri${i === filesArray.length - 2 ? '' : `[a${i+1}]`}`
    );
    const args = [
        ...filesArray.map(file => `-i "${file}"`),
        '-vn',
        `-filter_complex "${filterString.join(';')}"`,
        '-write_xing 0',
        `"${outputFile}"`
    ];

    const cmd = `ffmpeg ${args.join(' ')}`;
    console.log(cmd);
    await exec(cmd);
};

const unscrambleSingle = async ({
    input,
    output = path.join(__dirname, `../outputs/${getBaseFileName(input)}-unscrambled.mp3`),
    clipDuration,
    overlapRatio,
    timestampOrder,
    isYoutube
}) => {
    
    console.log({
        input,
        output
    });

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
    
    console.log({ isYoutube })
    const unscrambleFileOrder = (isYoutube ? [...outputs].reverse() : timestampOrder.map(index => outputs[index]))
        .map(file => file.outputFile);

    try { fs.unlinkSync(output); } catch (e) {}
    await mergeFilesWithCrossFade(
        unscrambleFileOrder,
        +((clipDuration * overlapRatio) - clipDuration).toFixed(4),
        output
    );

    await normalizeAudio(output);


    console.log('now clearing temp');
    for (let file of unscrambleFileOrder) {
        console.log({ file })
        fs.unlinkSync(file);
    }
    
    return output;
};

const unscrambleMp3 = async ({ 
    input,
    output = path.join(__dirname, `../outputs/${getBaseFileName(input)}-unscrambled.mp3`),
}) => {
    if (!input) {
        return console.error('no input defined');
    }

    console.log(`unscrambling ${input}`);

    let conversions;
    let isYoutube = false;
    try {
        const metadata = await read(input);
        console.log({ metadata })
        const parsedComment = parseObj(metadata.comment);
        const validScrambleMp3 = parsedComment && Array.isArray(parsedComment);
        console.log({ parsedComment, validScrambleMp3 })
        if (!validScrambleMp3) throw new Error();
        conversions = parsedComment;
    } catch (e) {
        console.error(`no metadata found for ${input}: ${e.toString()}`);
        console.error('reverting to default settings');
        isYoutube = true;
        conversions = [
            {
                clipDuration: 0.1, 
                overlapRatio: 2
            }
        ];
    }

    let curInput = input;
    let index = 1;
    for (let conversion of conversions.reverse()) {

        console.log(`starting ${index} of ${conversions.length}`);
        const output = path.join(__dirname, `../temp/${getBaseFileName(input)}-unscrambled-${index}.mp3`);
        console.log({ tempOutput: output });

        await unscrambleSingle({
            input: curInput,
            output,
            ...conversion,
            isYoutube
        });

        console.log(`done with ${index} of ${conversions.length}`);
        curInput = output;
        index++;

    }

    console.log('renaming', curInput, output);
    await fs.renameSync(curInput, output);
    return output;
}

module.exports = unscrambleMp3;