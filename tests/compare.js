// Compare the CSV file against the Package
// Requires: npm install csv
import QualityTx from "../index.mjs"
const fs = require("fs");
const { parse } = require("csv-parse");
const qtx = QualityTx()
fs.createReadStream("../resources/quality_test.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {
        let determined = qtx.getStringDescription(q, true)
        if (Object.keys(determined).map((key) => determined[key]) != row)
            console.log("Error: ", row[0])
    })
    .on("end", function () {
        console.log("finished");
    })
    .on("error", function (error) {
        console.log(error.message);
    });
