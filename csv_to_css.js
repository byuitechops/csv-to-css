// #!/usr/bin/env node

const request = require('request');
const dsv = require('d3-dsv');
const fs = require('fs');
const validate = require('csstree-validator');
const reporter = validate.reporters.json;
const cleanCSS = require('clean-css');
const chalk = require('chalk');
const md5 = require('md5');
const path = require('path');

// read the settings from wherever they are
function readSettings(dirPath) {
    // let things = path.resolve(__dirname, './settings.json');
    let fileObject = JSON.parse(fs.readFileSync(dirPath + 'settings.json', 'utf8'));
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

// Minify the CSS file
function minifyCSS(cssString, fileName) {
    let output = new cleanCSS({
        level: 2,
    }).minify(cssString);

    // validate the minified file
    let errors = validateCss(output.styles, fileName);

    // If there are no errors, it will return the minified file
    if (JSON.parse(errors).length === 0) {
        return {
            'output': output.styles,
            'valid': true
        };

        // If there are validation errors it will return the errors.
    } else {
        console.log(chalk.redBright(`There was an error minifying ${fileName}`));
        return {
            'output': errors,
            'valid': false
        };
    }
}

// Write the validated CSS to the specified path
function writeFile(path, fileGuts) {
    let color = path.includes('_errors') ? chalk.magenta : chalk.blue;
    fs.writeFileSync(path, fileGuts);
    console.log(color(`${path} written`));
}

function crossVerify(cssString) {
    let things = md5(cssString);
    let file = md5(fs.readFileSync('./styles.css'));
    console.log('NEW FILE: ' + things);
    console.log('OLD FILE: ' + file);
}

async function main() {
    let dirPath = path.resolve(__dirname, './csv-to-css');
    let settings = readSettings(dirPath);
    for (let i = 0; i < settings.length; i++) {
        try {
            // console.log(path);
            let fileName = settings[i].fileName;
            let csvString = await urlToCsv(settings[i].url);
            let cssObj = csvToObj(csvString);
            let cssString = objToCSS(cssObj);
            crossVerify(cssString);
            let errors = validateCss(cssString, fileName);
            let minify = {
                'valid': true
            };

            // minify file and check validity
            if (JSON.parse(errors).length === 0) {
                minify = minifyCSS(cssString, fileName);
            }

            /**
             * If there were errors in the regular file, or errors when minifying the file, those errors will be written to ${fileName}_errors.json,
             * and a log will be written informing the user to check that file for the errors. 
             */
            if (JSON.parse(errors).length !== 0 || minify.valid === false) {
                writeFile(`${fileName}_errors.json`, errors);
                if (minify.valid === false) writeFile(`${fileName}_errors.json`, minify.output);
                console.log(chalk.magenta(`Check ${fileName}_errors.json for errors`));
            } else {
                writeFile(`${fileName}.css`, cssString);
                writeFile(`${fileName}_mini.css`, minify.output);
            }
        } catch (e) {
            console.error(chalk.red(e));
        }
    }
}

main();

/**
 * Compare minified hash to the hash saved in settings. 
 * If the hash is the same, do nothing.
 * If there is no hash, or they are different, update the file, and add the hash to the ./settings.json file
 * Once everything has been looped through, write the settings file to the HD. 
 */