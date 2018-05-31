const request = require('request');
const dsv = require('d3-dsv');
const fs = require('fs');
const prompt = require('prompt');
const validate = require('csstree-validator');
// const cleanCSS = require('clean-css');

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

    // let fileObject = fs.readFile(/*'filepath */, utf8);

    settings.push({
        'url': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfipS75euk-z98mVV-uQRvgunM9k69utWbjGZl6lCN_xp7V0wGRS8UMPgwYtUMa85gNlJXqciM4zEZ/pub?gid=0&single=true&output=csv',
        'filePath': './style.css'
    }, {
        'url': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfipS75euk-z98mVV-uQRvgunM9k69utWbjGZl6lCN_xp7V0wGRS8UMPgwYtUMa85gNlJXqciM4zEZ/pub?gid=1272100&single=true&output=csv',
        'filePath': './cssfile.css'
    });
    console.log('Settings read');
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
    console.log('CSV obj created');
}

// Format csv to js obj
function csvToObj(csvString) {
    var csvObj = dsv.csvParse(csvString);
    console.log('CSV obj created');
    return csvObj;
}

// change the js object to correctly formatted css.
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
    console.log('css created')
    return cssStrings.filter(str => str !== null).join('\n');
}

function validateCss(cssString, setting) {
    var cleanString = cssString.replace(/\s*/g, '').replace(/\n*/g, '');
    let errors = validate.validateString(cleanString, setting.filePath);
    if (errors.messgae) console.log(errors.message);
}

var settings = [];

readSettings();
async function main() {
    for (let i = 0; i < settings.length; i++) {
        let csvString = await urlToCsv(settings[i].url);
        let cssObj = csvToObj(csvString);
        let cssString = objToCSS(cssObj);
        // let validatedCSS =
    }
}

// settings.map(setting => {
//     return urlToCsv(setting.url)
//         .then(csvToObj)
//         .then(objToCSS)
//         // .then(cssString => {
//         //     return validateCss(cssString, setting);
//         // })
//         .then(cssString => {
//             validateCss(cssString, setting);
//             fs.writeFileSync(setting.filePath, cssString);
//             return console.log(`Wrote ${setting.filePath}`);

//         })

//         .catch(console.err);