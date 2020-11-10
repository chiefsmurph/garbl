(async () => {
    const file = process.argv[2];
    console.log({ file });
    await require('../unscramble-mp3')(file);
})();