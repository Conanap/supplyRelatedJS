/**
* Author: Albion Fung
*
* This software may be redistributed, used and modified freely in anyway, as long as the software
* has this same condition. No credits are required.
*
* ALWAYS USE THE OLDEST RELEASE OF EACH VERSION FOR STABLE BUILD.
*
* v0.0
*
* --------------------------------------------------------------------------------------------------
*
* Known Issues:
*
* --------------------------------------------------------------------------------------------------
*
* Upcoming Features:
*
* --------------------------------------------------------------------------------------------------
*
* Changelog
*/

// form name
var formName = "Uniform Part Request Form";
// form description
var description = "If you require multiple parts, please fill in the forms multiple times.\n";
description += "You can find out the size of your uniform part <a href=\"facebook.com\">here</a>.\n";
description += "You must return your old uniform part when receiving the new part. If you don't have an old one, write 0 in old size.";

// spreadsheet name for sources
var sourceSheetName = "Supply";
// spreadsheet name for storing where 
var requestName = "Requests";
// sheet name
var todoName = "todo";

// part -> sheet name for sizes that are made
var sourceSizeMap = {
	"Headdress": "Headdress Size",
	"Dress Shirt": "M DS Size",
	"MT": "MT Size",
	"Socks": "Sock Size",
	"Tunic": "Tunic Size",
	"Parka": "Parka Size",
	"Boots": "Boot Size",
	"BS": null,
	"Tie": null,
	"Belt": null,
	"PT Shirt": null
};
// in the sizing sheet, which column contains sizes
var sizeColMap = {
	"Headdress Size": 1,
	"M DS Size": 3,
	"MT Size": 2,
	"Sock Size": 1,
	"Tunic Size": 2,
	"Parka Size": 3,
	"Boot Size": -1

};

var inventoryColMap = {};

// TOLERANCES - CHANGE IF NECESSARY
wtol = 1;
ltol = 1;



/* ----------------------- helpers ----------------------- */

// given spreadsheet name and sheet name, returns appropriate sheet
function getSheet(ssname, sname) {
	var files = DriveApp.getFilesByName(ssname);
	var ss = {};
	ss.getName = function() {return '';}; // temp for first loop

	while(files.hasNext() && ss.getName() !== ssname) {
		ss = files.next();
	}

	ss = SpreadsheetApp.open(ss);

	var sheet = ss.getSheetByName(sname);

	return sheet;
};

function getRequestSheet() {
	return getSheet(requestName, todoName);
};

// adds next request
/**
* requestObj struct:
* {
*	str email,
*	str fname,
*	str lname,
*	str rank,
*	str part,
*	int nsize,
*	int osize,
*	bool toOrder,
*	str notes
* }
*/
function addRequest(requestObj) {
	var email = requestObj.email;
	var fname = requestObj.fname;
	var lname = requestObj.lname;
	var rank = requestObj.rank;
	var part = requestObj.part;
	var nsize = requestObj.nsize;
	var osize = requestObj.osize;
	var orderString = requestObj.toOrder ? "Order" : "In inventory";

	// for next week!
	var reqsheet = getRequestSheet();
	reqsheet.appendRow([lname, fname, rank, part, nsize, orderString]);

	// for easier returning stuff
	var recsheet = getRecordSheet();
	recsheet.appendRow([lname, fname, rank, part, nsize, osize]);
};

function getSize(part, size) {
	// if it's boots we gotta make dem sizes an obj
	// ugh
	if(part === "Boots") {
		size = {
			length: size.substring(0, size.indexOf('-')),
			length: size.substring(size.indexOf('-') + 1)
		};

	} else if(part === "Dress Shirt" && isNaN(size)) {
		// idc if it's m or l, you need a one anyways
		size = parseInt(size.match(/\d+/)[0]);
	} else {
		size = parseInt(size);
	}

	return size;
};

function getSizeIndex(part, osize, sheet) {
	var sizes = sheet.getDataRange().getValues();
	var sheetName = sourceSizeMap[part];
	for(var i = 0; i < data.length; i++) {
		if(part === "Boots") {
			if(sizes[i][sizeColMap[sheetName]] == osize.length &&
				sizes[i][sizeColMap[sheetName] + 1] == osize.width) {
				return i;
			}
		} else {
			if(sizes[i][sizeColMap[sheetName]] == osize) {
				return i;
			}
		}
	}

	return -1;
};

function getSizeByIndex(part, index, sheet) {}

function getNextWedgeSize(osize, osizeI, widthOffset, lengthOffset, sheet) {
	if(widthOffset > 0 || lengthOffset > 0) {
		osizeI++;
	} else if(widthOffset < 0 || lengthOffset < 0) {
		osizeI--;
	}
	return {nsize: getSizeByIndex(osizeI + 1), nsizeI: osizeI + 1};
};

function getNextDSSize(osize, osizeI, widthOffset, lengthOffset, sheet) {};

function getNextTunicSize(osize, osizeI, widthOffset, lengthOffset, sheet) {};

function getNextParkaSize(osize, osizeI, widthOffset, lengthOffset, sheet) {};

function getNextPantsSize(osize,osizeI, widthOffset, lengthOffset, sheet) {};

function getNextBootSize(osize,osizeI, widthOffset, lengthOffset, sheet) {};

function getNextAvailable(part, osize, widthChange, lengthChange) {
	// grabing the sizes sheet for the part
	var sizingSheet = getSheet(sourceSheetName, sourceSizeMap[part]);
	var osizeI = getSizeIndex(part, osize, sizingSheet);

	if(osizeI < 0) { // size DNE
		return osizeI;
	}

	if(osizeI === 0) {
		if(widthChange < 0) {
			widthChange = 0;
		}

		if(lengthChange < 0) {
			lengthChange = 0;
		}
	}

	if(widthChange === 0 && lengthChange === 0) {
		return -1;
	}

	var wtol_t = wtol;
	var ltol_t = ltol;
	var nsizeObj = {};

	// now we look for new size
	while(nsizeI < 0 && wtol_t > 1 && ltol_t > 1) {
		nsizeObj = newSizeFuncs[part](osize, osizeI, widthChange, lengthChange, sizingSheet);
	}
};

/* ----------------------- actual updating func ----------------------- */
function updateResponse(formResponse) {
	JSON.stringify(formResponse);
	var part = formResponse.part;

	var requestObj = {
		email: formResponse.email,
		fname: formResponse.fname,
		lname: formResponse.lname,
		rank: formResponse.rank,
		part: part,
		osize: getSize(part, formResponse.part),
		notes: formResponse.notes
	};

	var widthChange = formResponse.widthChange;
	var lengthChange = formResponse.lengthChange;

	requestObj.nsize = getNextAvailable(part, requestObj.osize, widthChange, lengthChange);
};

/* ----------------------- API Function ----------------------- */
function doGet() {
	return HtmlService.createHtmlOutputFromFile('Form');
};