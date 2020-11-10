(async () => {
    const file = process.argv[2];
    console.log({ file });
    await require('../scramble-mp3')(file);
})();