/**
 * change the js object to correctly formatted css.
 * @param {object} csvObj 
 */
function objToCSS(csvObj) {
    let keysToKeep = ['courseCode', 'department', 'customCSS'];

    var metaDataTags = csvObj.columns.filter(column => column[0] === '@');
    var cssTags = csvObj.columns.filter(column => column.substr(0, 2) === '--');
    let departmentObject;
    let department;

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
            let courseCode = row.courseCode;
            let isValidCourseCode = /^[a-z]{1,5}\d{3}(?:-[a-z]+)?$/.test(courseCode);
            if (!isValidCourseCode) {
                error = makeValidateError(`${courseCode}: Invalid course code`, rowIndex, row);
                console.error(`${courseCode} is not a valid Course Code`);
            }
        } else {
            error = makeValidateError('There is no course code', rowIndex, row);
        }
        return error; //what it returns
    }

    function verifyRow(row, rowIndex) {
        let errors = [
            verifyCourseCode(row, rowIndex),
        ];

        department = row.department ? row.department : null;

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

    function createCssString(row, metaData, cssData) {

        var metaData = '/*' + toKeyVals(row, metaData) + '\n*/';
        var cssData = `.${row.courseCode} {` + toKeyVals(row, cssData) + '\n}';

        if (cssData !== '. {\n}') {
            return `${metaData}\n${cssData}\n${row.customCSS ? row.customCSS + '\n' : ''}\n`;
        }
        return;
    }

    /**
     * Seperate the keys to keep from the rest
     * @param {Object} row 
     */
    function seperateKeysToKeep(row) {
        let keysNotIncludingKeepers = Object.keys(row).reduce((acc, key) => {
            if (!keysToKeep.includes(key) && row[key] !== '') {
                acc[key] = row[key];
            }
            return acc;
        }, {});

        return keysNotIncludingKeepers;
    }

    function seperateMetaFromCSS(cssObj) {
        let sortedObject = Object.keys(cssObj).reduce((sorted, key) => {
            let list = 'meta';

            if (!key.includes('@')) {
                list = 'css';
            };

            sorted[list].push(key);
            // console.log(sorted);
            return sorted;
        }, {
                'meta': [],
                'css': []
            });
        return sortedObject;
    }

    let cssObjOut = csvObj.reduce((acc, row, rowIndex) => {
        let department = row.department ? row.department : null;
        if (department === null) {

        }

        // Verify that the row has the correct parts/is valid
        let errors = verifyRow(row, rowIndex);
        let seperatedKeys = seperateKeysToKeep(row);

        let metaDataAndCssObj = seperateMetaFromCSS(seperatedKeys);
        let cssString = createCssString(row, metaDataAndCssObj.meta, metaDataAndCssObj.css);


        // console.log(things);
        // acc.push(objectToReturn);
        // if (department !== null) {
        if (acc[department]) {
            acc[department] += cssString;
        } else {
            acc[department] = cssString;
        }

        return acc;
    }, {});

    return cssObjOut;
}

module.exports = objToCSS;