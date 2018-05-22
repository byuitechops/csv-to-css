const request = require('request');
const dsv = require('d3-dsv');
const fs = require('fs');
const prompt = require('prompt');
const validateCSS = require('css-validator');

/**
 * 
 * Settings:
 *      custom file: "path""url"
 *      csv file: "url"
 *      output file name: "path"
 * 
 * 1. Read in csv file (async)
 *      requestjs
 * 2. csv format to js object format
 *      d3-dsv
 * 3. js object to css
 *      
 */

// read the settings from wherever they are
function readSettings() {

    // fs.read

    settings.push({
        'url': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfipS75euk-z98mVV-uQRvgunM9k69utWbjGZl6lCN_xp7V0wGRS8UMPgwYtUMa85gNlJXqciM4zEZ/pub?gid=0&single=true&output=csv',
        'filePath': './style.css'
    }, {
            'url': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfipS75euk-z98mVV-uQRvgunM9k69utWbjGZl6lCN_xp7V0wGRS8UMPgwYtUMa85gNlJXqciM4zEZ/pub?gid=1272100&single=true&output=csv',
            'filePath': './cssfile.css'
        });
}

// Read in csv file
function urlToCsv(url) {
    return new Promise((resolve, reject) => {
        var options = {
            method: 'GET',
            uri: url
        };

        request(options, (err, response, body) => {
            if (err) return reject(err);
            resolve(body);
        });
    });
}

// Format csv to js obj
function csvToObj(csvString) {
    var csvObj = dsv.csvParse(csvString);
    return csvObj;
}

function objToCSS(csvObj) {
    var metaDataTags = csvObj.columns.filter(column => column[0] === '@');
    var cssTags = csvObj.columns.filter(column => column.substr(0, 2) === '--');

    function toKeyVals(row, arrayIn) {
        return arrayIn.reduce((acc, tag) => {
            if (row[tag] !== '') {
                acc += `\n${tag}: ${row[tag]};`;
            }
            return acc;
        }, '');
    }

    var cssStrings = csvObj.map(row => {
        var metaData = '/*' + toKeyVals(row, metaDataTags).replace(/@/g, '') + '\n*/';
        var cssData = `.${row.courseCode} {` + toKeyVals(row, cssTags) + '\n}';
        if (cssData !== '. {\n}') return `${metaData}\n${cssData}\n${row.customCSS ? row.customCSS + '\n' : ''}`;
        return null;
    });
    return cssStrings.filter(str => str !== null).join('\n');
}

function validateCss(cssString, filePath) {
    var options = {
        text: cssString,
        warning: 0
    }
    count = 0;
    validateCSS(cssString, (err, data) => {
        data.errors.forEach(error => {
            // console.log(error);
            // if (!error) return
            console.log(`${error.message.trim()} ${filePath} Line ${error.line} `)
            // console.log(`There is a ${error.message.trim()} on line ${error.line} `);
            count ++
        });
    });
    if (count > 0) return valid = false;
}

var settings = [];
let valid = true;

readSettings();
Promise.all(settings.map(setting => {
    return urlToCsv(setting.url)
        .then(csvToObj)
        .then(objToCSS)
        // .then(validateCss)
        .then(cssString => {
            validateCss(cssString, setting.filePath);
            if (valid){
            fs.writeFileSync(setting.filePath, cssString);
            console.log(valid);
            return console.log(`Wrote ${setting.filePath}`)
        }})
        .catch(console.err)
}));