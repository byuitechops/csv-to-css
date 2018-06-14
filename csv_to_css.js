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

/**
 * 
 * @param {string} dirPath 
 */
function readSettings(dirPath) {
    let fileObject;
    try {
        fileObject = fs.readFileSync(dirPath + '/settings.json', 'utf8');
        settingsHash = md5(fileObject);
        fileObject = JSON.parse(fileObject);
    } catch (err) {
        errorHandling(err);
    }
    return fileObject;
}

/**
 * 
 * @param {string} url 
 */
function urlToCsv(url) {
    return new Promise((resolve, reject) => {
        var options = {
            method: 'GET',
            uri: url
        };

        request(options, (err, response, body) => {
            if (err) return reject(errorHandling(err));
            resolve(body);
        });
    });
}

/**
 * Format csv to javascript obj
 * @param {string} csvString 
 */
function csvToObj(csvString) {
    var csvObj = dsv.csvParse(csvString, (row) => {
        // Trim all values
        for (let key in row) {
            row[key] = row[key].trim();
        }

        // Remove all spaces and lowercase all letters in course code
        if (row.courseCode) {
            row.courseCode = row.courseCode
                .replace(/\s/g, '')
                .toLowerCase();
        }
        return row;
    });
    return csvObj;
}

/**
 * change the js object to correctly formatted css.
 * @param {object} csvObj 
 */
function objToCSS(csvObj) {
    var metaDataTags = csvObj.columns.filter(column => column[0] === '@');
    var cssTags = csvObj.columns.filter(column => column.substr(0, 2) === '--');


    function makeValidateError(message, rowIndex, data) {
        return {
            message,
            rowIndex,
            data
        };
    }

    function verifyCourseCode(row, rowIndex) {
        let error = null;

        if (row.courseCode) {
            let isValidCourseCode = /^[a-z]{1,5}\d{3}(?:-[a-z]+)?$/.test(row.courseCode);
            if (!isValidCourseCode) {
                error = makeValidateError('Invalid course code', rowIndex);
            }
        } else {
            error = makeValidateError('There is no course code', rowIndex);
        }
        return error; //what it returns
    }

    function verifyRow(row, rowIndex) {
        let errors = [
            verifyCourseCode(row, rowIndex)
        ];

        return errors.filter(e => e !== null);
    }

    function toKeyVals(row, keysWeWant) {
        return keysWeWant.reduce((acc, key) => {
            if (row[key] !== '') {
                acc += `\n${key.replace(/^@/, '')}: ${row[key]};`;
            }
            return acc;
        }, '');
    }


    let cssObjOut = csvObj.reduce((acc, row, rowIndex) => {

        // Verify that the row has the correct parts/is valid
        let errors = verifyRow(row, rowIndex);
        // Check for errors 
        if (errors.length > 0) {
            //add errors to the acc.err
            acc.err.push(errors);
        } else {
            // create the css string 
            var metaData = '/*' + toKeyVals(row, metaDataTags) + '\n*/';
            var cssData = `.${row.courseCode} {` + toKeyVals(row, cssTags) + '\n}';
            // Skip the blank css rows
            if (cssData !== '. {\n}') {
                // add it to acc.css
                acc.css += `${metaData}\n${cssData}\n${row.customCSS ? row.customCSS + '\n' : ''}\n`;
            }
        }

        return acc;
    }, {
        css: '',
        err: []
    });

    return cssObjOut;
}


/**
 * change the js object to correctly formatted css.
 * @param {string} cssString 
 * @param {string} path 
 */
function validateCss(cssString, path) {
    let errors = reporter(validate.validateString(cssString, path));
    console.log(errors);
    let parsedErrors;
    try {
        parsedErrors = JSON.parse(errors);
    } catch (err) {
        errorHandling(err);
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
    console.log(errors);

    // If there are no errors, it will return the minified file
    if (errors.length === 0) {
        return {
            'output': output.styles,
            'valid': true
        };

        // If there are validation errors it will return the errors.
    } else {
        console.error(chalk.redBright(`There was an error minifying ${fileName}`));
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
    } catch (err) {
        errorHandling(err);
    }
    console.log(color(`${path} written`));
}

/**
 * Write errors in CSS code to errors file
 * @param {File} errorFile 
 * @param {Object} errors 
 */
function cssFileError(errorFile, errors) {
    try {
        writeFile(errorFile, JSON.stringify(errors, null, 4));
    } catch (err) {
        errorHandling(err);
    }
    console.log(chalk.redBright(`Check ${errorFile} for errors`));
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
    let formattedSettings;

    for (let i = 0; i < settings.length; i++) {
        try {
            // console.log(path);
            let fileName = settings[i].fileName;
            let csvString = await urlToCsv(settings[i].url);
            let cssObj = csvToObj(csvString);
            let cssString = objToCSS(cssObj);
            let errors = validateCss(cssString.css, fileName);
            // if (cssString.err.length > 0) errors = cssString.err;
            let errorFile = `${fileName}_errors.json`;
            let newHash;
            let minify = {
                'valid': true
            };

            // If there are errors send to errorHandling function
            if (errors.length !== 0) {
                cssFileError(errorFile, errors);
            } else {
                minify = minifyCSS(cssString.css, fileName);
                if (minify.valid === false) {
                    cssFileError(errorFile, minify.output);
                } else {
                    newHash = md5(minify.output);
                    if (newHash !== settings[i].hash) {
                        writeFile(`${fileName}.css`, cssString.css);
                        writeFile(`${fileName}_mini.css`, minify.output);
                        settings[i].hash = newHash;
                    }
                }
            }
        } catch (err) {
            errorHandling(err);
        }
    }
    try {
        formattedSettings = JSON.stringify(settings, null, 4);
    } catch (err) {
        errorHandling(err);
    }
    if (settingsHash !== md5(formattedSettings)) {
        try {
            fs.writeFileSync(`${__dirname}/settings.json`, formattedSettings);
        } catch (err) {
            errorHandling(err);
        }
        console.log(chalk.green('Settings updated'));
    } else {
        console.log(chalk.green('No files changed'));
    }
}

main();