// Checks all known quality codes to make sure they are valid against the library

// Compare a precompiled CSV file containing known Quality Codes against the CWMS-Data-Quality Class
// Requires: npm install csv
import Quality from "/index.js";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
const qtx = new QualityTx()
let errors = []
console.log("Running comparison test again known quality codes....")
const START_TIME = performance.now()
createReadStream("tests/resources/quality_codes.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {
        row.shift()
        let determined = qtx.getStringDescription(row[0], true)
        if (String(Object.keys(determined).map((key) => determined[key])) != String
            (row))
            errors.push([row[0], row, determined])
    })
    .on("end", function () {
        if (errors.length) console.log("Failed Comparisons:")
        for (const v of errors)
            console.log(v, "======================================")
        console.log('\x1b[32m', `\n\nRun complete. Completed in ${Math.round(performance.now() - START_TIME) / 1000}s`);
        console.log('\x1b[33m%s\x1b[0m', `\n\n\t\tFound ${errors.length} Errors.\n\n`)
    })
    .on("error", function (error) {
        console.log('\x1b[31m', error.message);
    });
