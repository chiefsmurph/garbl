const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../scramble-store.json');

function hashAudioData(filePath) {
    const buf = fs.readFileSync(filePath);
    // WAV: find the raw PCM "data" chunk and hash only that,
    // so stripping metadata tags doesn't change the fingerprint
    if (buf.slice(0, 4).toString('ascii') === 'RIFF') {
        let offset = 12;
        while (offset < buf.length - 8) {
            const chunkId = buf.slice(offset, offset + 4).toString('ascii');
            const chunkSize = buf.readUInt32LE(offset + 4);
            if (chunkId === 'data') {
                const audioData = buf.slice(offset + 8, offset + 8 + chunkSize);
                return crypto.createHash('sha256').update(audioData).digest('hex').slice(0, 16);
            }
            offset += 8 + chunkSize + (chunkSize % 2);
        }
    }
    // Non-WAV fallback: hash full file
    return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

function readStore() {
    try { return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')); }
    catch { return {}; }
}

function lookupMetadata(filePath) {
    try {
        const id = hashAudioData(filePath);
        return readStore()[id] || null;
    } catch { return null; }
}

function saveMetadata(filePath, metadata) {
    try {
        const id = hashAudioData(filePath);
        const store = readStore();
        store[id] = metadata;
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
        console.log(`saved metadata to store with id ${id}`);
    } catch (e) {
        console.error('failed to save metadata to store:', e);
    }
}

module.exports = { hashAudioData, lookupMetadata, saveMetadata };
