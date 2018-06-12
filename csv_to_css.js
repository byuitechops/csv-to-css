#!/usr/bin/env node

/*eslint linebreak-style: [0]*/


const request = require('request');
const dsv = require('d3-dsv');
const fs = require('fs');
const validate = require('csstree-validator');
const reporter = validate.reporters.json;
const cleanCSS = require('clean-css');
const chalk = require('chalk');
const md5 = require('md5');
const path = require('path');
let settingsHash;

// read the settings from wherever they are

// md5 needs non-parsed json to work. 
// 1. pass in object to readSettings including settingsHash
// 2. do it in two parts

function readSettings(dirPath) {
    let fileObject;
    try {
        fileObject = fs.readFileSync(dirPath + '/settings.json', 'utf8');
    } catch (e) {
        errorHandling(e);
    }
    settingsHash = md5(fileObject);
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
    let parsedErrors;
    try {
        parsedErrors = JSON.parse(errors);
    } catch (e) {
        errorHandling(e);
    }
    return parsedErrors;
}

/**
 * Minify the CSS file
 * @param {string} cssString 
 * @param {string} fileName 
 */
function minifyCSS(cssString, fileName) {
    let output = new cleanCSS({
        level: 2,
    }).minify(cssString);

    // validate the minified file
    let errors = validateCss(output.styles, fileName);

    // If there are no errors, it will return the minified file
    if (errors.length === 0) {
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

/**
 * Write the validated CSS to the specified path
 * @param {string} path 
 * @param {string} fileGuts Stuff to be written
 */
function writeFile(path, fileGuts) {
    let color = path.includes('_errors') ? chalk.magenta : chalk.blue;
    try {
        fs.writeFileSync(path, fileGuts);
    } catch (e) {
        errorHandling(e);
    }
    console.log(color(`${path} written`));
}

/**
 * Write errors in CSS code to errors file
 * @param {File} errorFile 
 * @param {Object} errors 
 */
function cssFileError(errorFile, errors) {
    writeFile(errorFile, errors);
    console.log(chalk.magenta(`Check ${errorFile} for errors`));
}

/**
 * Handle errors when running
 * @param {Error} err 
 */
function errorHandling(err) {
    console.error(err.stack);
}

async function main() {
    let dirPath = path.resolve(__dirname);
    let settings = readSettings(dirPath);

    for (let i = 0; i < settings.length; i++) {
        try {
            // console.log(path);
            let fileName = settings[i].fileName;
            let csvString = await urlToCsv(settings[i].url);
            let cssObj = csvToObj(csvString);
            let cssString = objToCSS(cssObj);
            try {
                fs.writeFileSync(`File${i}.txt`, cssString);
            } catch (e) {
                errorHandling(e);
            }
            let errors = validateCss(cssString, fileName);
            let errorFile = `${fileName}_errors.json`;
            let newHash;
            let minify = {
                'valid': true
            };

            // If there are errors send to errorHandling function
            if (errors.length !== 0) {
                cssFileError(errorFile, errors);
            } else {
                minify = minifyCSS(cssString, fileName);
                if (minify.valid === false) {
                    cssFileError(errorFile, minify.output);
                } else {
                    newHash = md5(minify.output);
                    if (newHash !== settings[i].hash) {
                        writeFile(`${fileName}.css`, cssString);
                        writeFile(`${fileName}_mini.css`, minify.output);
                        settings[i].hash = newHash;
                    }
                }
            }
        } catch (e) {
            errorHandling(e);
        }
    }
    if (settingsHash !== md5(settings)) {
        try {
            fs.writeFileSync(`${__dirname}/settings.json`, JSON.stringify(settings, null, 4));
        } catch (e) {
            errorHandling(e);
        }
        console.log(chalk.green('Settings updated'));
    } else {
        console.log(chalk.green('Nothing changed'));
    }
}

main();