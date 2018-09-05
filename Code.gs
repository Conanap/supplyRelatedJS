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
	"Headdress Size": 2,
	"M DS Size": 3,
	"MT Size": 2,
	"Sock Size": 2,
	"Tunic Size": 2,
	"Parka Size": 3,
    "Boot Size": 3

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
		size =
			size.substring(0, size.indexOf('-')).trim() + '-' +
			size.substring(size.indexOf('-') + 1).trim();

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
        if(sizes[i][sizeColMap[sheetName]] == osize) {
          return i;
        }
	}

	return -1;
};

function getSizeByIndex(part, index, sheet) {
    var sizes = sheet.getDataRange().getValues();
    var sheetName = sourceSizeMap[part];

    return sizes[index][sizeColMap[sheetName]];
};

function getGenericSizedItem(part, osize, osizeI, widthOffset, lengthOffset, sheet) {
	if(widthOffset > 0 || lengthOffset > 0) {
		osizeI++;
	} else if(widthOffset < 0 || lengthOffset < 0) {
		osizeI--;
	}
	return {nsize: getSizeByIndex(part, osizeI + 1, sheet), nsizeI: osizeI + 1};
};

function getNextWedgeSize(osize, osizeI, widthOffset, lengthOffset, sheet) {
	return getGenericSizedItem('Headdress', osize, osizeI, widthOffset, lengthOffset, sheet);
};

function getNextDSSize(osize, osizeI, widthOffset, lengthOffset, sheet) {
	return getGenericSizedItem('Dress Shirt', osize, osizeI, widthOffset, lengthOffset, sheet);
};

function getGenericFourDigitSize(part, osize, osizeI, widthOffset, lengthOffset, sheet) {
	var nsize = osize;
	var tempi = osizeI;

	// traverse length first
	while(ltol_t > 0 && tempi > 0 && lengthOffset && nsize.substring(0, 2) == osize.substring(0, 2)) {
		tempi += lengthOffset;
		// nsizeI = getSizeIndex(part, tempi, sheet);
		nsize = getSizeByIndex(part, tempi, sheet);
	}

	// move to same width
	while(nsize.substring(2) != osize.substring(2)) {
		tempi++;
		// nsizeI = getSizeIndex(part, tempi, sheet);
		nsize = getSizeByIndex(part, tempi, sheet);
	}

	// then bother with width
	while(wtol_t > 0 && tempi > 0 && widthOffset && nsize.substring(2) == osize.substring(2)) {
		tempi += widthOffset;
		nsize = getSizeByIndex(part, tempi, sheet);
	}

	return {nsize: nsize, nsizeI: tempi};
};

function getNextTunicSize(osize, osizeI, widthOffset, lengthOffset, sheet) {
	return getGenericFourDigitSize("Tunic", osize, osizeI, widthOffset, lengthOffset, sheet);
};

function getNextParkaSize(osize, osizeI, widthOffset, lengthOffset, sheet) {
	return getGenericFourDigitSize("Parka", osize, osizeI, widthOffset, lengthOffset, sheet);
};

function getNextPantsSize(osize,osizeI, widthOffset, lengthOffset, sheet) {
	return getGenericFourDigitSize("MT", osize, osizeI, widthOffset, lengthOffset, sheet);
};

function getNextBootSize(osize, osizeI, widthOffset, lengthOffset, sheet) {
	// boots are two part sized
	// osize is an obj
  
    // deep copy
	var nsize = {
		length: osize.length,
		width: osize.width
	};

  while(ltol_t > 0 && osizeI > 0 && lengthOffset && nsize.substring(0, nsize.indexOf('-')) === osize.substring(0, osize.indexOf('-'))) {
      osizeI += lengthOffset;
      nsize = getSizeByIndex(part, osizeI, sheet);
  }

  while(ltol_t > 0 && osizeI > 0 && widthOffset && nsize.substring(nsize.indexOf('-') + 1) === osize.substring(osize.indexOf('-') + 1)) {
      osizeI += widthOffset;
      nsize = getSizeByIndex(part, osizeI, sheet);
  }
  
  return {nsize: nsize, nsizeI: osizeI};
};

function getNextUnNumdSize(part, osize, osizeI, sheet) {
    var nsize, nsizeI = 0;

    switch(osize) {
        case 'XS':
            nsize = 'S';
            break;
        case 'S':
            nsize = 'M';
            break;
        case 'M':
            nsize = 'L';
            break;
        case 'L':
            nsize = 'XL';
            break;
        case 'XL':
            nsize = 'XL';
            nsizeI = -1;
            break;
    }
  
    nsizeI += (osizeI + 1);
    return { nsize: nsize, nsizeI: nsizeI };
};

function getNextBeltSize(part, osize, osizeI, sheet) {
    return { nsize: 'X-LONG', nsizeI: osizeI };
}

var newSizeFuncs = {
    "Headdress": getNextWedgeSize,
	"Dress Shirt": getNextDSSize,
	"MT": getNextPantsSize,
	"Socks": getNextUnNumdSize,
	"Tunic": getNextTunicSize,
	"Parka": getNextParkaSize,
	"Boots": getNextBootSize,
	"BS": getNextUnNumdSize,
	"Tie": getNextUnNumdSize,
	"Belt": getNextBeltSize,
	"PT Shirt": getNextUnNumdSize
};

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

	// need to check if exceed max size

	var wtol_t = wtol;
	var ltol_t = ltol;
	var nsizeObj = {};
  
    // next size needed
    nsizeObj = newSizeFuncs[part](osize, osizeI, widthChange, lengthChange, sizingSheet);
  
    // if it's bs, tie, belt or pt shirt we can just straight return
    // might need to adapt or remove this depending on how your inventory works; we don't have counts on those items.
    if(part === 'BS' || part === 'Tie' || part === 'Belt' || part === 'PT Shirt') {
        return nsizeObj;
    }

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

    // get next available size to offer
	requestObj.nsize = getNextAvailable(part, requestObj.osize, widthChange, lengthChange);
  
    // now find the closest size within tolerance
};

/* ----------------------- API Function ----------------------- */
function doGet() {
	return HtmlService.createHtmlOutputFromFile('Form');
};