/*************************************************************************
 * Declare Required Variables and Libraries
 *************************************************************************/
const 
    // From Node
    fs = require('fs'),
    path = require('path'),
    // From NPM
    chalk = require('chalk'),
    request = require('request'),
    dsv = require('d3-dsv'),
    md5 = require('md5'),
    cleanCSS = require('clean-css'),
    validate = require('csstree-validator'),
    reporter = validate.reporters.json,
    // From Local
    objToCss = require('./objToCss'),
    // Other Vars
    date = new Date(),
    dateUpdated = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
let settingsHash;

/*************************************************************************
 * Handles errors when running. 
 * Use whenever an error needs to be logged.
 * @param {Error} err The message or object that will be logged
 *************************************************************************/
function errorHandling(err) {
    console.error(err.stack);
}

/*************************************************************************
 * This writes to files when possible, and logs an error when it cannot
 * @param {string} path Output destination
 * @param {string} fileGuts Stuff to be written
 *************************************************************************/
function writeFile(path, fileGuts) { 
    let color = path.includes('_errors') ? chalk.magenta : chalk.blue;
    try {
        fs.writeFileSync(path, fileGuts);
    } catch (err) {
        errorHandling(err);
    }
    console.log(color(`${path} written`));
}

/*************************************************************************
 * Read in settings from settings.json file. 
 * Uses path.join to bridge dirPath and settings.json
 * @param {string} dirPath The path to the settings file
 *************************************************************************/
function readSettings(dirPath) { //
    let fileObject;
    try {
        fileObject = fs.readFileSync(path.join(dirPath, '/settings.json'), 'utf8');
        settingsHash = md5(fileObject);
        fileObject = JSON.parse(fileObject);
    } catch (err) {
        errorHandling(err);
    }
    return fileObject;
}

/*************************************************************************
 * This takes a url and returns the content of that url. For purposes of 
 * this program, the content should be the CSV that contains css data.
 * @param {string} url - get this url from the settings.json
 *************************************************************************/
function urlToCsv(url) { //
    return new Promise((resolve, reject) => {
        let options = {
            method: 'GET',
            uri: url
        };
        request(options, (err, response, body) => {
            if (err) return reject(errorHandling(err));
            resolve(body);
        });
    });
}

/*************************************************************************
 * Format csv to javascript obj using d3-dsv, then make some minor tweaks
 * before returning the tweaked object
 * @param {string} csvString - get this from urlToCSV function
 *************************************************************************/
function csvToObj(csvString) { //
    let csvObj = dsv.csvParse(csvString, (row) => {
        // Trim all values
        for (let key in row) {
            row[key] = row[key].trim();
        }
        // Remove all spaces and set all letters to lowercase in course code
        if (row.courseCode) {
            row.courseCode = row.courseCode
                .replace(/\s/g, '')
                .toLowerCase();
        }

        return row;
    });
    return csvObj;
}
// TODO Finish Adding Comments and Explinations
/*************************************************************************
 * change the js object to correctly formatted css.
 * @param {string} cssString css string to be validated
 * @param {string} path ---- 
 *************************************************************************/
function validateCss(cssString, path) {
    let errors = reporter(validate.validateString(cssString.cssString, path));
    let parsedErrors;
    try {
        parsedErrors = JSON.parse(errors);
    } catch (err) {
        errorHandling(err);
    }
    if (cssString.errors && cssString.errors.length > 0) {
        parsedErrors = parsedErrors.concat(cssString.errors);
    }
    return parsedErrors;
}

// TODO Finish Adding Comments and Explinations
/*************************************************************************
 * Minify the CSS file
 * @param {string} cssString ----
 * @param {string} fileName ----
 *************************************************************************/
function minifyCSS(cssString, fileName) {
    // initial minification of file
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
// TODO Finish Adding Comments and Explinations
/*************************************************************************
 * Checks if the directory defined in settings.directoryPath exists.
 * Creates it if it doesn't.
 * 
 * Code drawn from StackOverflow: https://stackoverflow.com/a/40385651
 * 
 * @param {String} pathName ----
 *************************************************************************/
function createDir(pathName) { // 
    function isDir(dpath) {
        try {
            return fs.lstatSync(dpath).isDirectory();
        } catch (e) {
            return false;
        }
    }
    pathName = path.normalize(pathName).split(path.sep);
    pathName.forEach((sdir, index) => {
        var pathInQuestion = pathName.slice(0, index + 1).join(path.sep);
        if (!isDir(pathInQuestion) && pathInQuestion) fs.mkdirSync(pathInQuestion);
    });
}
// TODO Finish Adding Comments and Explinations
/*************************************************************************
 * Write errors in CSS code to errors file
 * @param {File} errorFile ----
 * @param {Object} errors ----
 *************************************************************************/
function cssFileError(errorFile, errors) { // 
    try {
        writeFile(errorFile, JSON.stringify(errors, null, 4));
    } catch (err) {
        errorHandling(err);
    }
    console.log(chalk.redBright(`Check ${errorFile} for errors`));
}


// // TODO Abstract main() further
// /*************************************************************************
//  * 
//  *************************************************************************/
// async function main() {
//     let dirPath = path.resolve(__dirname),
//         settings = readSettings(dirPath),
//         formattedSettings;

//     for (let i = 0; i < settings.length; i++) {
//         try {
//             let csvString = await urlToCsv(settings[i].url),
//                 csvObj = csvToObj(csvString),
//                 cssFinalObjects = objToCss(csvObj),
//                 pathName = settings[i].directoryPath.slice(-1) === '/' ? settings[i].directoryPath : settings[i].directoryPath + '/';

//             Object.keys(cssFinalObjects).forEach(department => {
//                 let fileName = department.replace(/\s/g, '_'),
//                     errors = validateCss(cssFinalObjects[department], fileName),
//                     errorFile = `${pathName}${department}_errors_${dateUpdated}.json`,
//                     newHash,
//                     minify = {
//                         'valid': true
//                     };

//                 // If there are errors send to errorHandling function
//                 createDir(pathName);
//                 if (errors.length !== 0) {
//                     try {
//                         cssFileError(errorFile, errors);
//                     } catch (err) {
//                         errorHandling(err);
//                     }
//                 } else {
//                     minify = minifyCSS(cssFinalObjects[department].cssString, fileName);
//                     if (minify.valid === false) {
//                         cssFileError(errorFile, minify.output);
//                     } else {
//                         newHash = md5(minify.output);
//                         if (newHash !== settings[i].departmentHash[department]) {
//                             writeFile(`${pathName}${fileName}_readable_${dateUpdated}.css`, cssFinalObjects[department].cssString);
//                             createDir(`${pathName}minified/`);
//                             writeFile(`${pathName}minified/${fileName}_${dateUpdated}.css`, minify.output);
//                             settings[i].departmentHash[department] = newHash;
//                         }
//                     }
//                 }
//             });
//         } catch (err) {
//             errorHandling(err);
//         }
//     }
//     try {
//         formattedSettings = JSON.stringify(settings, null, 4);
//     } catch (err) {
//         errorHandling(err);
//     }
//     if (settingsHash !== md5(formattedSettings)) {
//         try {
//             fs.writeFileSync(`${__dirname}/settings.json`, formattedSettings);
//         } catch (err) {
//             errorHandling(err);
//         }
//         console.log(chalk.green('Settings updated'));
//     } else {
//         console.log(chalk.green('No files changed'));
//     }
// }

// main();