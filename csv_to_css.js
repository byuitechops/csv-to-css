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
const date = new Date();
const dateUpdated = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
const objToCss = require('./objToCss');
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
    let requiredValues = [];
    let csvObj = dsv.csvParse(csvString, (row) => {
        // Trim all values
        for (let key in row) {
            row[key] = row[key].trim();
            if (!(key.includes('@') || key.includes('--')) && row[key] !== '') {
                requiredValues.push(`{${key}: ${row[key]}}`);
                delete row[key];
            }
        }

        // Remove all spaces and lowercase all letters in course code
        if (row.courseCode) {
            row.courseCode = row.courseCode
                .replace(/\s/g, '')
                .toLowerCase();
        }

        return row;
    });
    console.log(csvObj)
    return {
        csvObj,
        requiredValues
    };
}

/**
 * change the js object to correctly formatted css.
 * @param {string} cssString 
 * @param {string} path 
 */
function validateCss(cssString, path) {
    let errors = reporter(validate.validateString(cssString.css, path));
    let parsedErrors;
    try {
        parsedErrors = JSON.parse(errors);
    } catch (err) {
        errorHandling(err);
    }
    if (cssString.err && cssString.err.length > 0) {
        parsedErrors.push(cssString.err);
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
            let cssFinalObjects = objToCss(cssObj.csvObj); // An array of objects. 1 object per row.

            let errors = validateCss(cssFinalObjects[1], fileName);
            let errorFile = `${fileName}_errors_${dateUpdated}.json`;
            let newHash;
            let minify = {
                'valid': true
            };

            // If there are errors send to errorHandling function
            if (errors.length !== 0) {
                try {
                    cssFileError(errorFile, errors);
                } catch (err) {
                    errorHandling(err);
                }
            } else {
                minify = minifyCSS(cssFinalObjects[1].css, fileName);
                if (minify.valid === false) {
                    cssFileError(errorFile, minify.output);
                } else {
                    newHash = md5(minify.output);
                    if (newHash !== settings[i].hash) {
                        writeFile(`${fileName}_readable_${dateUpdated}.css`, cssFinalObjects[1].css);
                        writeFile(`${fileName}_${dateUpdated}.css`, minify.output);
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