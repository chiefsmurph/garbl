// json parse stringify
const reverseString = str => str.split('').reverse().join('');
const stringObj = obj => reverseString(JSON.stringify(obj));
const parseObj = str => JSON.parse(reverseString(str));


module.exports = {
    stringObj,
    parseObj,
};