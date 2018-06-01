const request = require('request');
const dsv = require('d3-dsv');
const fs = require('fs');
const prompt = require('prompt');
const validate = require('csstree-validator');
const reporter = require('csstree-validator').reporters.json;
// const cleanCSS = require('clean-css');

// read the settings from wherever they are
function readSettings() {

    // let fileObject = fs.readFile(/*'filepath */, utf8);

    return [{
        'url': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfipS75euk-z98mVV-uQRvgunM9k69utWbjGZl6lCN_xp7V0wGRS8UMPgwYtUMa85gNlJXqciM4zEZ/pub?gid=0&single=true&output=csv',
        'filePath': './style.css'
    }, {
        'url': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfipS75euk-z98mVV-uQRvgunM9k69utWbjGZl6lCN_xp7V0wGRS8UMPgwYtUMa85gNlJXqciM4zEZ/pub?gid=1272100&single=true&output=csv',
        'filePath': './cssfile.css'
    }];
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
    return cssStrings.filter(str => str !== null).join('\n');
}

// Validate the CSS string
function validateCssAndErrorLog(cssString, path) {
    // var cleanString = cssString.replace(/\s*/g, '').replace(/\n*/g, '');
    let errors = reporter(validate.validateString(cssString, path));

    if (JSON.parse(errors).length !== 0) {
        console.log(`Invalid CSS in file ${path}`);
        writeFile(`${path}_errors.json`, errors);
    } else {
        console.log(`Valid CSS in file ${path}`);
    }
    return errors;
}

// Write the validated CSS to the specified path
function writeFile(path, fileGuts) {
    fs.writeFileSync(path, fileGuts);
    console.log(`${path} written`);
}

async function main() {
    let settings = readSettings();
    for (let i = 0; i < settings.length; i++) {
        try {
            let csvString = await urlToCsv(settings[i].url);
            let cssObj = csvToObj(csvString);
            let cssString = objToCSS(cssObj);
            let errors = validateCssAndErrorLog(cssString, settings[i].filePath);
            // Write the CSS file if there are no errors
            if (JSON.parse(errors).length === 0) {
                writeFile(settings[i].filePath, cssString);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

main();