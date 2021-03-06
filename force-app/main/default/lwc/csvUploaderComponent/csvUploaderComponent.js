import { LightningElement, track, wire, api } from "lwc";
import getDataList from "@salesforce/apex/csvUploaderController.getData";
import updateDataList from "@salesforce/apex/csvUploaderController.updateData";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { loadScript } from "lightning/platformResourceLoader";
import PARSER from "@salesforce/resourceUrl/PapaParse";

export default class CsvUploaderComponent extends LightningElement {
  @track error;
  @track data;
  showLoadingSpinner = false;
  filesUploaded;
  fileName;
  parserInitialized = false;
  columnMapping = {
    CUPS: "Id",
    "Data Quality": "Data_Quality_Description__c"
  };

  getData() {
    this.showLoadingSpinner = true;
    getDataList()
      .then((data) => {
        this.data = data;
        console.log("data ", data);
        this.downloadCSVFile();
        this.error = undefined;
      })
      .catch((error) => {
        this.error = error;
        this.showLoadingSpinner = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error while getting Data",
            message: error.message,
            variant: "error"
          })
        );
        this.data = undefined;
      });
  }

  downloadCSVFile() {
    const headerMapping = this.columnMapping;
    let rowEnd = "\n";
    let csvString = "";
    // this set elminates the duplicates if have any duplicate keys
    let rowData = new Set();
    let columnHeader = new Set();

    // getting keys from data
    this.data.forEach(function (record) {
      Object.keys(record).forEach(function (key) {
        console.log(key);
        let fieldLabel = Object.keys(headerMapping).find(
          (objKey) => headerMapping[objKey] === key
        );
        fieldLabel ? columnHeader.add(fieldLabel) : columnHeader.add(key);

        rowData.add(key);
      });
    });

    // Array.from() method returns an Array object from any object with a length property or an iterable object.
    rowData = Array.from(rowData);
    columnHeader = Array.from(columnHeader);

    // splitting using ','
    csvString += columnHeader.join(",");
    csvString += rowEnd;

    // main for loop to get the data based on key value
    for (let i = 0; i < this.data.length; i++) {
      let colValue = 0;

      // validating keys in data
      for (let key in rowData) {
        if (rowData.hasOwnProperty(key)) {
          // Key value
          // Ex: Id, Name
          let rowKey = rowData[key];
          // add , after every value except the first.
          if (colValue > 0) {
            csvString += ",";
          }
          // If the column is undefined, it as blank in the CSV file.
          let value =
            this.data[i][rowKey] === undefined ? "" : this.data[i][rowKey];
          csvString += '"' + value + '"';
          colValue++;
        }
      }
      csvString += rowEnd;
    }

    // Creating anchor element to download
    let downloadElement = document.createElement("a");

    // This  encodeURI encodes special characters, except: , / ? : @ & = + $ # (Use encodeURIComponent() to encode these characters).
    downloadElement.href =
      "data:text/csv;charset=utf-8," + encodeURI(csvString);
    downloadElement.target = "_self";
    // CSV File Name
    downloadElement.download = "Account Data.csv";
    // below statement is required if you are using firefox browser
    document.body.appendChild(downloadElement);
    // click() Javascript function to download CSV file
    downloadElement.click();
    this.showLoadingSpinner = false;
  }

  get acceptedFormats() {
    return [".csv"];
  }
  handleSave() {
    if (this.filesUploaded) {
      const file = this.filesUploaded;
      const headerMapping = this.columnMapping;
      Papa.parse(file, {
        quoteChar: '"',
        header: "true",
        skipEmptyLines: "true",
        Worker: "true",

        transformHeader: function (h) {
          return headerMapping.hasOwnProperty(h) && headerMapping[h] != ""
            ? headerMapping[h]
            : h;
        },
        complete: (results) => {
          const result = results.data;

          console.log("result  ", result);
          this.updateData(result);
        },
        error: (error) => {
          console.error(error);
        }
      });
    } else {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Please Attach CSV before Submitting",
          variant: "error"
        })
      );
    }
  }

  handleFilesChange(event) {
    if (event.target.files.length > 0) {
      this.filesUploaded = event.target.files[0];
      this.fileName = event.target.files[0].name;
    }
  }

  renderedCallback() {
    if (!this.parserInitialized) {
      console.log("inside");
      loadScript(this, PARSER)
        .then(() => {
          console.log("Loaded");
          this.parserInitialized = true;
        })
        .catch((error) => console.error(error));
    }
  }

  @api async updateData(result) {
    this.showLoadingSpinner = true;

    await updateDataList({ recordList: result })
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Records Updated Successfully",
            variant: "Success"
          })
        );
        console.log("Updated");
        this.showLoadingSpinner = false;
      })
      .catch((error) => {
        this.error = error;
        console.log(error);

        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error!",
            message: error.body.message,
            variant: "error"
          })
        );
        this.showLoadingSpinner = false;
        this.data = undefined;
      });
  }
}
