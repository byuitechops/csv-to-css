const request = require('request');
const dsv = require('d3-dsv');
const fs = require('fs');
const validate = require('csstree-validator');
const reporter = validate.reporters.json;
const cleanCSS = require('clean-css');

// read the settings from wherever they are
function readSettings() {
    let fileObject = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
    return fileObject;
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
function validateCss(cssString, path) {
    let errors = reporter(validate.validateString(cssString, path));
    return errors;
}

// Write the validated CSS to the specified path
function writeFile(path, fileGuts) {
    fs.writeFileSync(path, fileGuts);
    console.log(`${path} written`);
}

function minifyCSS(cssString) {
    let output = new cleanCSS({
        level: 2,
    }).minify(cssString);
    console.log('ERR: ' + output.errors);
    console.log(`WARNINGS ${output.warnings}`);
    console.log(output.stats);
    console.log('MAP: ' + output.sourceMap);
    return output.styles;
}

async function main() {
    let settings = readSettings();
    for (let i = 0; i < settings.length; i++) {
        try {
            let fileName = settings[i].fileName;
            let csvString = await urlToCsv(settings[i].url);
            let cssObj = csvToObj(csvString);
            let cssString = objToCSS(cssObj);
            let minify = minifyCSS(cssString);
            let errors = validateCss(minify, fileName);
            console.log(errors);
            // Write the CSS file if there are no errors
            if (JSON.parse(errors).length === 0) {
                writeFile(`${fileName}.css`, cssString);
            } else {
                writeFile(`${fileName}_errors.json`, errors);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

main();