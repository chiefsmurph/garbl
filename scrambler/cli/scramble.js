(async () => {
    const file = process.argv[2];
    console.log({ file });
    await require('../actions/scramble-mp3')({ input: file });
})();