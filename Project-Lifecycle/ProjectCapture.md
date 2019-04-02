# Project Capture Document for csv-to-css
#### *Author: Theron Dowdle*
#### *Stakeholder(s): Corey Moore*
#### *Date: 4/2/2019*


## Background

-----

## Objectives


## Background
Many of the courses have unique css both online and on campus.  They have been keeping track of the styles with a spreadsheet, and wanted a way to create a css file(s) from that spreadsheet

-----

## Definition of Done
This tool should transform a spreadsheet with a specific formatting into a valid CSS file, both human-readable and minified.

-----

# Requirements

### General Requirements

### Input Requirements

#### Definition of Inputs

CSV

Headers:
| @courseName | @lastEditedBy | @lastEditDate | @professorName | courseCode | department | --color1 | --color24 | --color35 | --button-color | customCSS |
|-------------|---------------|---------------|----------------|------------|------------|----------|-----------|-----------|----------------|-----------|

JSON - Get the url to the spreadsheet, name of the folder, any extra css, and the check hashes for any written files

```json
[
    {
        "url": "https://docs.google.com/spreadsheets/validresource",
        "name": "Campus",
        "extraCss": "aFileToAppend.css",
        "departmentHash": {
            "Department One": "HashingGoodness",
            "Other Department": "OtherSuchHashingStuffs"
        }
    },
    {
        "url": "https://docs.google.com/spreadsheets/validresource",
        "name": "Online",
        "extraCss": "",
        "departmentHash": {"Blank object"}
    },
    {
        "url": "https://docs.google.com/spreadsheets/othervalidthings",
        "name": "Pathway",
        "extraCss": "extraFile.css",
        "departmentHash": {}
    }
]
```


<!-- List here a type definition for each input. For example, if it is a CSV define the column names. If it is a JSON, give an example of the JSON structure. If it is user input, what will the user be asked for? -->

#### Source of Inputs

* Currently from a published google sheet

    To publish a sheet: 'File + Publish to the Web'

* JSON settings file

<!-- Paragraph of how to get inputs. From who? From where: Slack, email, server...? This also includes user selected options at runtime. How will we know what options to select? For example, in conversion tool, you'd follow the values on the Trello Board. It would also include the steps to get access to the information you need, such as getting added to a Trello Board, or access to a server. -->

---

### Output Requirements

#### Definition of Outputs

Valid human-readable and minified CSS files with the contents of the CSV input

<!-- List here a type definition for each output? For example, if the changes are directly to the LMS, list all changes that occur. If it is a CSV define the column names. If it is a JSON, give an example of the JSON structure. -->

#### Destination of Outputs

Saved to hard-drive

<!-- Paragraph where/who to send outputs. To who? To where: Email, server, directly to LMS...? It would also include the steps to get access to the locations you need, such as getting added to a Trello Board, or access to a server, or the LMS. -->

---

### User Interface

#### Type:

CLI - No prompt or Flags

`csvToCss`

-----

## Expectations

### Timeline: Done

### Best Mode of Contact: Slack/email

### Next Meeting: N/A


### Action Items
<!-- Recap Meeting -->
#### TechOps
#### Stakeholder

-----

#### *Approved By:* 
#### *Approval Date:*