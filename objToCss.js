/**
 * change the js object to correctly formatted css.
 * @param {object} csvObj 
 */
function objToCSS(csvObj) {
    var metaDataTags = csvObj.columns.filter(column => column[0] === '@');
    var cssTags = csvObj.columns.filter(column => column.substr(0, 2) === '--');
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

    function createCssString(row) {

        var metaData = '/*' + toKeyVals(row, metaDataTags) + '\n*/';
        var cssData = `.${row.courseCode} {` + toKeyVals(row, cssTags) + '\n}';

        if (cssData !== '. {\n}') {
            return `${metaData}\n${cssData}\n${row.customCSS ? row.customCSS + '\n' : ''}\n`;
        }
        return;
    }

    function createReturnObject(department, css, errors) {
        let returnedObj = {
            department,
            css,
            'errors': errors ? errors : null
        };

        return returnedObj;
    }

    let cssObjOut = csvObj.reduce((acc, row, rowIndex) => {

        /**
         * Potential change to handle departments:
         *  A different function to create the css string.
         *  inside that function have the course code declared and added to the object.
         *  Return the object, and add that to the acc array.
         */



        // Verify that the row has the correct parts/is valid
        let errors = verifyRow(row, rowIndex);


        let cssString = createCssString(row);
        let objectToReturn = createReturnObject(department, cssString, errors);

        // console.log(things);
        acc.push(objectToReturn);


        // Check for errors 
        // if (errors.length > 0) {
        //     //add errors to the acc.err
        //     acc.err.push(errors);
        // }
        // // else {
        // // create the css string 
        // var metaData = '/*' + toKeyVals(row, metaDataTags) + '\n*/';
        // var cssData = `.${row.courseCode} {` + toKeyVals(row, cssTags) + '\n}';
        // // Skip the blank css rows
        // if (cssData !== '. {\n}') {
        //     // add it to acc.css
        //     acc.css += `${metaData}\n${cssData}\n${row.customCSS ? row.customCSS + '\n' : ''}\n`;
        //     // }
        // }

        return acc;
    }, []);

    return cssObjOut;
}

module.exports = objToCSS;