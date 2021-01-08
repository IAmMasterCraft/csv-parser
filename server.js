const mime = require('mime');
const urlRequest = require('request');
const csv = require('csvtojson');
const express = require("express");
const uniqid = require('uniqid');
// cors
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const validateCsv = (url) => {
    const mimeToArr = mime.getType(url).split("/");
    return (mimeToArr[mimeToArr.length - 1] === "csv") ? true : false;
}

const parseAndFilterCsvToJson = async(url, selectFields = []) => {
    const jsonOutput = await csv().fromStream(urlRequest.get(url));
    const filteredData = []
    jsonOutput.filter(record => {
        const filteredRecord = {};
        if (selectFields.length > 0) {
            selectFields.forEach(header => { filteredRecord[header] = record[header] });
            filteredData.push(filteredRecord);
        } else {
            filteredData.push(record);
        }
    });
    return filteredData;
}

// validateCsv("https://people.sc.fsu.edu/~jburkardt/data/csv/biostats.csv");
// parseAndFilterCsvToJson("https://people.sc.fsu.edu/~jburkardt/data/csv/biostats.csv", ["Name", "Sex", "Age"]); 

app.post("/", (request, response) => {
    const url = request.csv.url;
    const selectFields = (request.csv.select_fields) ? request.csv.select_fields : [];
    if (validateCsv(url)) {
        const responseData = {
            conversion_key: uniqid(),
            json: parseAndFilterCsvToJson(url, selectFields),
        };
        response.status(200).json(responseData);
    } else {
        //return bad data error
        response.status(400).json({
            message: "url is not for a valid csv file",
        });
    }
});

const port = process.env.PORT || 5000;

app.listen(port, (() => console.log(`server started on port ${port}`)));