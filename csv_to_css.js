const request = require('request');
const dsv = require('d3-dsv');
const fs = require('fs');
const prompt = require('prompt');
const validateCSS = require('css-validator');
const cleanCSS = require('clean-css');

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

    settings.push(settings);
}

// Read in csv file
function urlToCsv(url) {
    return new Promise((resolve, reject) => {
        var options = {
            method: 'GET',
            url: url
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

function validateCss(cssString, setting) {
    return new Promise((resolve, reject) => {
        // if (err) {
        //     console.log(err);
        //     reject(err);
        // }
        var options = {
            text: cssString,
            warning: 0
        }
        var cleanString = cssString.replace(/\s*/g, '').replace(/\n*/g, '');
        console.log(cssString);
        validateCSS(cleanString, (err, data) => {
            if (data.errors.length !== 0) {
                console.log(data.errors);
                data.errors.forEach(error => {
                    console.log(`There is a ${error.message.trim()} on line ${error.line} of ${setting.filePath}`);
                });
                console.log(`Please fix the errors in file ${setting.filePath}`);
                valid = false;
                resolve(valid);
            }
            else {
                resolve(cssString);
            }
        });
    })
}

// minify css file
function minifyCss() {
    cleanCSS.;
}

var settings = [];
let valid = true;

readSettings();
Promise.all(settings.map(setting => {
    return urlToCsv(setting.url)
        .then(csvToObj)
        .then(objToCSS)
        // .then(cssString => {
        //     return validateCss(cssString, setting);
        // })
        .then(cssString => {
            if (valid === true) {
                fs.writeFileSync(setting.filePath, cssString);
                return console.log(`Wrote ${setting.filePath}`)
            }
            else console.log('Fix the errors to write the files.')
        })

        .catch(console.err)
}));