# csv-to-css

## Purpose

This tool takes a published CSV document, converts it into a CSS file, determines if it's valid CSS and writes it to the hard-drive. If the CSS is not valid, it will write a JSON file containing the errors.  


## How to Install

Open the console and type:

```
npm install -g byuitechops/csv-to-css
```


## How to Run

```js
csvToCss
```

### Inputs

**CSV URL**

Input the URL for the published google sheet where your csv data is.

**CSV Document Format**

* All properties are optional
* If there is customCSS, it needs to be valid when inputted

| @courseName | @lastEditedBy | @lastEditDate | @professorName | courseCode | --color1 | --color24 | --color35 | --button-color | customCSS |
|-------------|---------------|---------------|----------------|------------|----------|-----------|-----------|----------------|-----------|
|Intergalactic Warfare | Lord Vader | 6/5/2120 | Darth Sidious | GW350 | Black | Red | | White | .deathStar{ color: grey; } 
|Singing: Screamo | This guy |  | Ring Wraith | MUS200 | | Black | Grey | |

**Settings**

```json
[
    {
        "url": "https://www.g",
        "fileName": "styles",
        "hash": "486e7e2ccdb15f36dcc2ddecb354f7ae"
    },
    {
        "url": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfipS75euk-z98mVV-uQRvgunM9k69utWbjGZl6lCN_xp7V0wGRS8UMPgwYtUMa85gNlJXqciM4zEZ/pub?gid=1272100&single=true&output=csv",
        "fileName": "cssfile",
        "hash": null
    },
    {
        "url": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0AML_IbiwbQQq2AzniXDXwC3OW3Nbx8ErozNc5YBKQrwNfaVKzfU3in6UHxYL71eRGIU1k9riRVwD/pub?gid=0&single=true&output=csv",
        "fileName": "campus",
        "hash": "f9ac5f6b81186ce6860c278a2eae4de6"
    }
]
```



### Outputs

A log will be given of what happens during execution.  
If the CSS is invalid, the file will not be written. Instead a JSON file is written containing the errors.

```js
// Valid CSS
Valid CSS in file ./style.css
./style.css written

// Invalid CSS
Invalid CSS in file ./cssfile.css
./cssfile.css_errors.json written
```

## Requirements

* Read the CSV from a published google sheet
* If there is an empty property in the CSV, it will be skipped when converted to CSS
* Output valid CSS documents
* Log any CSS errors in a JSON document

## Development

### Execution Process

#### Read in settings
Read the settings file and return an array containing objects with `url` and `filePath` properties

#### Retrieve and manipulate the data
Use the URL in the settings object to retrieve the CSV data and convert it to CSS.

#### Validation
Check whether the CSS is valid.  

_**if valid**_

Write the valid, formatted CSS to a file named `${settings.filePath}.css`


_**if not valid**_

Write a JSON file named `${settings.filePath}_errors.json` containing any errors in the CSS

