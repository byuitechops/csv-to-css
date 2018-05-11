const request = require('request');
const dsv = require('d3-dsv');
const fs = require('fs');

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
    var metaDataTags = csvObj.columns.filter(column => column[0] === '@').map(col => col.slice(1));
    var cssTags = csvObj.columns.filter(column => column[0] + column[1] === '--');

    var cssStrings = csvObj.map(row => {
        var metaData = metaDataTags.reduce((acc, metaDataTag) => {
            return acc += `\n${metaDataTag}: ${row[metaDataTag]}`;
        }, '/*') + '\n*/';
        var cssData = cssTags.reduce((acc, cssTag) => {
            return acc += `\n${cssTag}: ${row[cssTag]};`;
        }, `.${row.courseCode} {`) + '\n}';
        return `\n${metaData}\n${cssData}\n${row.customCSS}`;
    });
    return cssStrings.join('\n');
}

var settings = {
    'url': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfipS75euk-z98mVV-uQRvgunM9k69utWbjGZl6lCN_xp7V0wGRS8UMPgwYtUMa85gNlJXqciM4zEZ/pub?gid=0&single=true&output=csv',
    'filePath': './style.css'
};

urlToCsv(settings.url)
    .then(csvToObj)
    .then(objToCSS)
    .then(cssString => {
        fs.writeFileSync(settings.filePath, cssString);
        return console.log('IT\'S DONE, FOOL');
    })
    .catch(console.err);
