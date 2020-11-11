(async () => {
    const file = process.argv[2];
    console.log({ file });
    await require('../actions/unscramble-mp3')(file);
})();