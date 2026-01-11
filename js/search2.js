/* Utility */

var DEBUG = false;
var MOCK = false;

var displayedImages = [];
var currentQueryIds = [];
var numberOfCollisions = 0;
var numImages = 0;
var startingNumImages = 0;
var imagesReturned = 0;
var grid;
var startDateTimeCalendar;
var endDateTimeCalendar;

var enableCookies;

var lastSearchId = 0;
var currentSearch = null;
var cancelledSearches = [];

var flickrAPIKey = "d61091b4772d0e40c3743b6a5fc54084";
var itemsPerPage = 100;
var licenseList;
var selectedLicenses = [];
var selectedColors = [];
var selectedStyles = [];
var selectedOrientations = [];
var flickrOrigin = 1076371200; // Tuesday, February 10, 2004 12:00:00 AM
var timeDifferenceMS = 2*60*60*1000; // this is 2 hours
var timeDifference = timeDifferenceMS/1000;
var colorKey = [
	["b", "Pale Pink", "#ff9f9c"], 
	["a", "Pink", "#f52394"], 
	["0", "Red", "#ff2000"], 
	["1", "Dark Orange", "#a24615"], 
	["2", "Orange", "#ff7c00"], 
	["4", "Lemon Yellow", "#fffa00"],
	["3", "School Bus Yellow", "#ffcf00"],
	["5", "Green", "#90e200"],
	["6", "Dark Lime Green", "#00ab00"],
	["7", "Cyan", "#00b2d4"],
	["8", "Blue", "#0062c6"],
	["9", "Violet", "#8c20ba"],
	["c", "White", "#ffffff"],
	["d", "Gray", "#7c7c7c"],
	["e", "Black", "#000000"]
];
var styleKey = [
	["blackandwhite", "Black and White"],
	["depthoffield", "Depth of Field"],
	["minimalism", "Minimalism"],
	["pattern", "Pattern"]
];

function shuffle(array)
{
	var i = 0
	  , j = 0
	  , temp = null
  
	for (i = array.length - 1; i > 0; i -= 1) {
	  j = Math.floor(Math.random() * (i + 1))
	  temp = array[i]
	  array[i] = array[j]
	  array[j] = temp
	}
}
  
function capitalizeFirstLetter(string)
{
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function getColorNameByFlickrId(flickrId)
{
	for(var i = 0; i < colorKey.length; i++)
	{
		if(colorKey[i][0] == flickrId.toString())
		{
			return colorKey[i][1];
		}
	}
	return null;
}

function getStyleNameByFlickrText(text)
{
	for(var i = 0; i < styleKey.length; i++)
	{
		if(styleKey[i][0] == text)
		{
			return styleKey[i][1];
		}
	}
	return null;
}

function toggleColorLink(colorLink)
{
	if($(colorLink).hasClass("checked"))
	{
		$(colorLink).removeClass("checked");
		$(colorLink).addClass("unchecked");
	}
	else
	{
		$(colorLink).removeClass("unchecked");
		$(colorLink).addClass("checked");
	}
}

function dateToString(date)
{
	var dateString = "";
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	dateString += months[date.getMonth()] + " ";
	dateString += date.getDate() + ", ";
	dateString += date.getFullYear() + " ";
	if(date.getHours() < 10)
	{
		dateString += "0";
	}
	dateString += date.getHours() + ":";
	if(date.getMinutes() < 10)
	{
		dateString += "0";
	}
	dateString += date.getMinutes() + ":";
	if(date.getSeconds() < 10)
	{
		dateString += "0";
	}
	dateString += date.getSeconds();
	return dateString;
}

function getMediumSizeSrc(imageSizeObj)
{
	var smallestLargeSizeObj = null;
	var largestSizeObj = null;
	for(var i = 0; i < imageSizeObj.length; i++)
	{
		if(parseInt(imageSizeObj[i].width) >= 600)
		{
			if(smallestLargeSizeObj == null)
			{
				if(imageSizeObj[i].media == "photo")
				{
					smallestLargeSizeObj = imageSizeObj[i];
				}
			}
			else if(parseInt(smallestLargeSizeObj.width) > parseInt(imageSizeObj[i].width) && imageSizeObj[i].media == "photo")
			{
				smallestLargeSizeObj = imageSizeObj[i];
			}
		}
		if(imageSizeObj[i].media == "photo")
		{
			if(largestSizeObj == null)
			{
				largestSizeObj = imageSizeObj[i];
			}
			else if(parseInt(largestSizeObj.width) < parseInt(imageSizeObj[i].width))
			{
				largestSizeObj = imageSizeObj[i];
			}
		}
	}
	if(smallestLargeSizeObj == null)
	{
		return largestSizeObj.source;
	}
	return smallestLargeSizeObj.source;
}

function getOriginalSizeSrc(imageSizeObj)
{
	var largestSizeObj = null;
	for(var i = 0; i < imageSizeObj.length; i++)
	{
		if(imageSizeObj[i].label == "Original")
		{
			return imageSizeObj[i].source;
		}
		if(imageSizeObj[i].media == "photo")
		{
			if(largestSizeObj == null)
			{
				largestSizeObj = imageSizeObj[i];
			}
			else if(parseInt(largestSizeObj.width) < parseInt(imageSizeObj[i].width))
			{
				largestSizeObj = imageSizeObj[i];
			}
		}
	}
	return largestSizeObj.source;
}

function getImageWidth(imageSizeObj)
{
	for(var i = 0; i < imageSizeObj.length; i++)
	{
		if(imageSizeObj[i].label == "Original")
		{
			return imageSizeObj[i].width;
		}
	}
	return imageSizeObj[imageSizeObj.length - 1].width;
}

function getImageHeight(imageSizeObj)
{
	for(var i = 0; i < imageSizeObj.length; i++)
	{
		if(imageSizeObj[i].label == "Original")
		{
			return imageSizeObj[i].height;
		}
	}
	return imageSizeObj[imageSizeObj.length - 1].height;
}

function downloadImages()
{
	localStorage.setItem("randm-flickr-pickr.downloadImages", JSON.stringify(displayedImages));
	window.open("download.html", "_blank");
}

function getLicenseName(id)
{
	for(var i = 0; i < licenseList.length; i++)
	{
		if(licenseList[i].id == id)
		{
			return licenseList[i].name;
		}
	}
	return null;
}

function expandDateRange(search)
{
	// returns array of length 2 [newMinDate, newMaxDate]
	// returns null if things don't make sense
	if(search.maxDate <= search.minDate)
	{
		// error checking, you never know
		return null;
	}
	var rangeLength = search.maxDate - search.minDate;
	var newMinDate = search.minDate - Math.floor(rangeLength / 2);
	var newMaxDate = search.maxDate + Math.floor(rangeLength / 2);

	if(!search.chooseDate && newMinDate < flickrOrigin)
	{
		var diff = flickrOrigin - newMinDate;
		newMinDate = flickrOrigin;
		newMaxDate = newMaxDate + diff;
	}
	if(search.chooseDate && newMinDate < search.origMinDate)
	{
		var diff = search.origMinDate - newMinDate;
		newMinDate = search.origMinDate;
		newMaxDate = newMaxDate + diff;
	}
	if(!search.chooseDate && newMaxDate > search.now)
	{
		var diff = newMaxDate - search.now;
		newMaxDate = search.now;
		newMinDate = newMinDate - diff;
		if(newMinDate < flickrOrigin)
		{
			newMinDate = flickrOrigin;
		}
	}
	if(search.chooseDate && newMaxDate > search.origMaxDate)
	{
		var diff = newMaxDate - search.origMaxDate;
		newMaxDate = search.origMaxDate;
		newMinDate = newMinDate - diff;
		if(newMinDate < search.origMinDate)
		{
			newMinDate = search.origMinDate;
		}
	}

	return [newMinDate, newMaxDate];
}

function getSearchStrings(search)
{
	var strings = new Object();
	strings.minDateString = "&min_upload_date=" + search.minDate;
	strings.maxDateString = "&max_upload_date=" + search.maxDate;

	strings.textTagString = "";
	if(search.textTag !== null)
	{
		strings.textTagString = "&text=" + encodeURIComponent(search.textTag);
	}

	strings.useridString = "";
	if(search.userid !== null)
	{
		strings.useridString = "&user_id=" + encodeURIComponent(search.userid);
	}

	strings.safeSearch = "";
	switch(search.safeSearchLevel)
	{
		case "safe":
			strings.safeSearch = "&safe_search=1";
			break;
		case "moderate":
			strings.safeSearch = "&safe_search=2";
			break;
		case "restricted":
			strings.safeSearch = "&safe_search=3";
			break;
	}
	
	strings.colors = "";
	if(search.currentColors.length > 0)
	{
		strings.colors += "&color_codes=" + search.currentColors.join();
	}
	
	strings.styles = "";
	if(search.currentStyles.length > 0)
	{
		strings.styles += "&styles=" + search.currentStyles.join();
	}
	
	strings.orientations = "&orientation=" + search.currentOrientations.join();

	strings.minSizeString = "";
	if(search.minWidth !== null || search.minHeight !== null)
	{
		strings.minSizeString = "&dimension_search_mode=min";
		if(search.minWidth !== null)
		{
			strings.minSizeString += "&width=" + search.minWidth;
		}
		if(search.minHeight !== null)
		{
			strings.minSizeString += "&height=" + search.minHeight;
		}
	}

	strings.mediaTypeString = "";
	if(search.mediaType != "all")
	{
		strings.mediaTypeString = "&media=" + search.mediaType;
	}

	return strings;
}

/* End utility */

/* Cookie */

function removeAllCookies()
{
	var cookie = Cookies.get();
	cookie = Object.keys(cookie);
	cookie.forEach(function(key)
	{
		Cookies.remove(key);
	});
}

function getEnableCookies()
{
	var cookie = Cookies.get("enableCookies");
	if(typeof cookie != "undefined")
	{
		if(cookie == "true")
		{
			enableCookies = true;
			$('#enableCookiesCheck')[0].checked = true;
		}
	}
	else
	{
		enableCookies = false;
		removeAllCookies();
	}
}

function setEnableCookies()
{
	if(enableCookies)
	{
		Cookies.set("enableCookies", enableCookies, {expires: 365});
	}
}

function getTextboxCookie(name)
{
	var cookie = Cookies.get(name + "Box");
	if(typeof cookie != "undefined" && cookie != "")
	{
		$("#" + name + "Box").val(cookie);
	}
}

function setTextboxCookie(name)
{
	if(enableCookies)
	{
		if($("#" + name + "Box").val() == "")
		{
			Cookies.remove(name + "Box");
		}
		else
		{
			Cookies.set(name + "Box", $('#' + name + 'Box').val(), {expires: 365});
		}
	}
}

function getCheckboxCookie(name, checkAll)
{
	var cookie = Cookies.get(name);
	if(typeof cookie != "undefined" && cookie != "")
	{
		window['selected' + capitalizeFirstLetter(name)] = cookie.split(",");

		$('#' + name + 'Boxes input[type="checkbox"]').each(function()
		{
			if(window['selected' + capitalizeFirstLetter(name)].indexOf($(this).attr("data")) > -1)
			{
				this.checked = true;
			}
			else
			{
				this.checked = false;
			}
		});
	}
	else
	{
		if(checkAll)
		{
			$('#' + name + 'Boxes input[type="checkbox"]').each(function()
			{
				this.checked = true;
			});
		}
	}
}

function setCheckboxCookie(name)
{
	if(enableCookies)
	{
		var selectedArray = window['selected' + capitalizeFirstLetter(name)];
		Cookies.set(name, selectedArray.join(), {expires: 365});
	}
}

function getRadioCookie(name)
{
	var cookie = Cookies.get(name + "Radio");
	if(typeof cookie != "undefined")
	{
		$('#' + name + 'Chooser input[type="radio"]').prop("checked", false);
		$('#' + name + 'Chooser input[value="' + cookie + '"]').prop("checked", true);
	}
}

function setRadioCookie(name)
{
	if(enableCookies)
	{
		Cookies.set(name + "Radio", $("#" + name + "Chooser input[type='radio']:checked").val(), {expires: 365});
	}
}

function getCheckboxCookies()
{
	getCheckboxCookie("styles", false);
	getCheckboxCookie("orientations", true);
	getCheckboxCookie("licenses", true);
	updateActiveRadioChecks();
}

function setCheckboxCookies()
{
	if(enableCookies)
	{
		setCheckboxCookie("styles");
		setCheckboxCookie("licenses");
		setCheckboxCookie("orientations");
	}
}

function getRadioCookies()
{
	getRadioCookie("imageSize");
	getRadioCookie("safeSearch");
	getRadioCookie("mediaType");
	getRadioCookie("dateType");
	getRadioCookie("selectionType");
	getRadioCookie("imageNumbers");
	getRadioCookie("minSize");
	updateActiveRadioChecks();
}

function setRadioCookies()
{
	if(enableCookies)
	{
		setRadioCookie("imageSize");
		setRadioCookie("safeSearch");
		setRadioCookie("mediaType");
		setRadioCookie("dateType");
		setRadioCookie("selectionType");
		setRadioCookie("imageNumbers");
		setRadioCookie("minSize");
	}
}

function getTextboxCookies()
{
	getTextboxCookie("numImages");
	getTextboxCookie("textTag");
	getTextboxCookie("userid");
	getTextboxCookie("sizeWidth");
	getTextboxCookie("sizeHeight");
	getTextboxCookie("startDateTime");
	getTextboxCookie("endDateTime");
}

function setTextboxCookies()
{
	if(enableCookies)
	{
		setTextboxCookie("numImages");
		setTextboxCookie("textTag");
		setTextboxCookie("userid");
		setTextboxCookie("sizeWidth");
		setTextboxCookie("sizeHeight");
		setTextboxCookie("startDateTime");
		setTextboxCookie("endDateTime");
	}
}

function getColorSearchCookie()
{
	var cookie = Cookies.get("colors");
	if(typeof cookie != "undefined" && cookie != "")
	{
		selectedColors = cookie.split(",");
		$('.colorLink').each(function()
		{
			if(selectedColors.indexOf($(this).attr("data")) > -1)
			{
				$(this).removeClass("unchecked");
				$(this).addClass("checked");
			}
		});
	}
}

function setColorSearchCookie()
{
	if(enableCookies)
	{
		Cookies.set("colors", selectedColors.join(), {expires: 365});
	}
}


function resetCookies()
{
	if(enableCookies)
	{
		setCheckboxCookies();
		setRadioCookies();
		setTextboxCookies();
		setColorSearchCookie();
	}
}

function getAllCookies()
{
	getLicenses();

	getCheckboxCookies();
	getRadioCookies();
	getTextboxCookies();
	getColorSearchCookie();
}

/* End Cookie */

/* Search */

class Search
{
	constructor()
	{
		this.searchId = lastSearchId;
		lastSearchId++;
		this.chooseRandom = null; // whether or not we are choosing random images or the first x available
		this.textTag = null;
		this.userid = null;
		this.currentLicenses = null;
		this.currentColors = null;
		this.currentStyles = null;
		this.currentOrientations = null;
		this.minWidth = null;
		this.minHeight = null;
		this.mediaType = null;
		this.chooseDate = null; // whether or not they are choosing the date
		this.minDate = null;
		this.maxDate = null;
		this.safeSearchLevel = null;
		this.origMinDate = null;
		this.origMaxDate = null;
		this.now = null;
		this.repeatMode = false;
	}
}

class Result
{
	constructor()
	{
		this.totalPhotos = null;
		this.listObj = null;
		this.search = null;
		this.indexArray = null;
	}
}

class Photo
{
	constructor()
	{
		this.index = null;
		this.imageObj = null;
        this.imageInfoObj = null;
		this.imageSizeObj = null;
		this.result = null;
	}
}

function copySearch(search)
{
	var newSearch = new Search();
	newSearch.chooseRandom = search.chooseRandom;
	newSearch.textTag = search.textTag;
	newSearch.userid = search.userid;
	newSearch.currentLicenses = search.currentLicenses;
	newSearch.currentColors = search.currentColors;
	newSearch.currentStyles = search.currentStyles;
	newSearch.currentOrientations = search.currentOrientations;
	newSearch.minWidth = search.minWidth;
	newSearch.minHeight = search.minHeight;
	newSearch.mediaType = search.mediaType;
	newSearch.chooseDate = search.chooseDate;
	newSearch.minDate = search.minDate;
	newSearch.maxDate = search.maxDate;
	newSearch.safeSearchLevel = search.safeSearchLevel;
	newSearch.origMinDate = search.origMinDate;
	newSearch.origMaxDate = search.origMaxDate;
	newSearch.now = search.now;
	newSearch.searchId = search.searchId;

	return newSearch;
}

function cancelSearch()
{
	if(DEBUG)
	{
		console.log("-canceling search-");
	}
	numImages = 0;
	enableButtonHideBar();
	cancelledSearches.push(currentSearch);
	currentSearch = null;
}

function mainSearch(search)
{
	if(DEBUG)
	{
		console.log("-mainSearch start-");
	}
	if(search == null)
	{
		search = submitForm();
		resetCookies();
		if(search == null)
		{
			return null;
		}
	}
	if(DEBUG)
	{
		console.log(search);
	}
	if(cancelledSearches.indexOf(search.searchId) != -1)
	{
		if(DEBUG)
		{
			console.log("-----This search was cancelled.-----");
		}
		return null;
	}
	currentSearch = search.searchId;
	search = setStartingDates(search);
	var strings = getSearchStrings(search);
	var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + flickrAPIKey + "&license=" + search.currentLicenses.join() + strings.minDateString + strings.maxDateString + strings.textTagString + strings.useridString + strings.colors + strings.styles + strings.orientations + strings.safeSearch + strings.minSizeString + strings.mediaTypeString + "&url_o&per_page=" + itemsPerPage + "&format=json&nojsoncallback=1";
	if(DEBUG)
	{
		console.log("initialSearch url:");
		console.log(url);
	}

	var def = $.Deferred();
	
	var initialResult = def.then(function () {return initialSearch(url)});

	def.resolve();

	var processed = initialResult.then(function(msg)
	{
		return processResult(search, msg);
	});
	
	var getResult = processed.then(function(result)
	{
		if(DEBUG)
		{
			console.log("-getResult-");
			console.log(result);
		}
		if(result == null)
		{
			return null;
		}
		return checkResultSize(result);
	});

	var choosePhoto = getResult.then(function(result)
	{
		if(DEBUG)
		{
			console.log("-choosePhoto-");
			console.log(result);
		}
		if(result == null)
		{
			return null;
		}
		return pickImage(result);
	});

	var retrievePhoto = choosePhoto.then(function(response)
	{
		if(DEBUG)
		{
			console.log("-retrievePhoto-");
			console.log(response);
		}
		if(response == null)
		{
			return null;
		}
		var photos = [];
		var promises = [];
		for(var i = 0; i < response.length; i++)
		{
			promises.push(getPhoto(response[i].photo, response[i].pageNumber).then(function(photo)
			{
				photos.push(photo);
			}));
		}
		return $.when(...promises).then(function() {return photos});
	});

	var photoWithInfo = retrievePhoto.then(function(photos)
	{
		var promises = [];
		if(DEBUG)
		{
			console.log("-photoWithInfo-");
			console.log(photos);
		}
		if(photos == null || photos[0].imageObj == null)
		{
			return null;
		}
		if(numImages > 0) // we still have more to pick
		{
			if(photos[0].result.search.chooseDate)
			{
				var search = copySearch(photos[0].result.search);
				search.minDate = search.origMinDate;
				search.maxDate = search.origMaxDate;
				search.origMinDate = null;
				search.origMaxDate = null;
				mainSearch(search);
			}
			else
			{
				var search = copySearch(photos[0].result.search);
				search.minDate = null;
				search.maxDate = null;
				mainSearch(search);
			}
		}
		for(var i = 0; i < photos.length; i++)
		{
			(function(i)
			{
				if(photos[i] != null)
				{
					if(photos[i].imageObj != null)
					{
						if(currentQueryIds.indexOf(photos[i].imageObj.id) == -1 || MOCK)
						{
							currentQueryIds.push(photos[i].imageObj.id);
							var url = "https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=" + flickrAPIKey + "&photo_id=" + photos[i].imageObj.id + "&secret=" + photos[i].imageObj.secret + "&format=json&nojsoncallback=1";
							if(DEBUG)
							{
								console.log("infosearch url");
								console.log(url);
							}
							if(DEBUG && MOCK)
							{
								console.log("-infosearch will return-");
								console.log(infoSearch(url));
							}
							var infoPromise = infoSearch(url).then(function(msg) {
								if(DEBUG)
								{
									console.log("-infosearch returned:-");
									console.log(photos);
									console.log(i);
								}
								if(typeof msg.stat !== "undefined" && msg.stat == "fail")
								{
									messageOutput("Flickr error: " + msg.message);
									photos[i] = null;
								}
								else
								{
									photos[i].imageInfoObj = msg.photo;
								}
							})
							promises.push(infoPromise);
						}
						else
						{
							if(DEBUG)
							{
								console.log("We already found id#" + photos[i].imageObj.id);
							}

							numberOfCollisions++;
							numImages++;
							if(photos[0].result.search.chooseDate)
							{
								var search = copySearch(photos[0].result.search);
								search.minDate = search.origMinDate;
								search.maxDate = search.origMaxDate;
								search.origMinDate = null;
								search.origMaxDate = null;
								mainSearch(search);
								photos[i] = null;
							}
							else
							{
								var search = copySearch(photos[0].result.search);
								search.minDate = null;
								search.maxDate = null;
								mainSearch(search);
								photos[i] = null;
							}
						}
					}
				}
			})(i);
		}
		return $.when(...promises).then(function() {return photos});
	});

	var restartOrMoveOn = photoWithInfo.then(function(photos)
	{
		var promises = [];
		if(DEBUG)
		{
			console.log("-restartOrMoveOn-");
			console.log(photos);
		}
		if(photos == null)
		{
			return null;
		}
		for(var i = 0; i < photos.length; i++)
		{
			(function(i)
			{
				var url = "https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=" + flickrAPIKey + "&photo_id=" + photos[i].imageInfoObj.id + "&secret=" + photos[i].imageInfoObj.secret + "&format=json&nojsoncallback=1";
				if(DEBUG)
				{
					console.log("sizesearch url");
					console.log(url);
				}
				promises.push(sizeSearch(url).then(function(msg) {
					if(typeof msg.stat === "undefined" && msg.stat == "fail")
					{
						messageOutput("Flickr error: " + msg.message);
						photos[i] = null;
					}
					else
					{
						photos[i].imageSizeObj = msg.sizes.size;
					}
				}));
			})(i);
		};
		return $.when(...promises).then(function() {return photos});
	});

	restartOrMoveOn.then(function(photos)
	{
		if(photos == null)
		{
			return null;
		}
		for(var i = 0; i < photos.length; i++)
		{
			outputImageData(photos[i]);
		}
		if(numImages == 0)
		{
			enableButtonHideBar();
			currentSearch = null;
		}
	});
}

function setStartingDates(search)
{
	if(DEBUG)
	{
		console.log("-setStartingDates-");
		console.log(search);
	}
	if(!search.chooseDate)
	{
		if(search.minDate == null && search.maxDate == null)
		{
			// choose a 2-hour block of time since the beginning of Flickr. These variables are global.
			search.minDate = Math.floor(Math.random() * ((search.now - timeDifference) - flickrOrigin + 1)) + flickrOrigin;
			search.maxDate = search.minDate + (timeDifference);
		}
		
		search.origMinDate = search.minDate;
		search.origMaxDate = search.maxDate;
	}
	else if(search.chooseRandom)
	{
		if(search.origMinDate == null && search.origMaxDate == null)
		{
			search.origMinDate = search.minDate;
			search.origMaxDate = search.maxDate;
			if((search.origMaxDate - search.origMinDate) > timeDifference)
			{
				search.minDate = Math.floor(Math.random() * ((search.origMaxDate - timeDifference) - search.origMinDate + 1)) + search.origMinDate;
				search.maxDate = search.minDate + (timeDifference);
			}
		}
	}

	return search;
}

function processResult(search, msg)
{
	if(DEBUG)
	{
		console.log("-processResult-");
		console.log(search);
		console.log(msg);
	}
	if(typeof msg.stat !== "undefined" && msg.stat == "fail")
	{
		messageOutput("Flickr error: " + msg.message);
		return null;
	}
	else
	{
		var result = new Result();
		result.search = search;
		result.listObj = msg.photos;
		result.totalPhotos = parseInt(result.listObj.total);
		return result;
	}
}

function checkResultSize(result)
{
	if(DEBUG)
	{
		console.log("-checkResultSize-");
		console.log(result);
	}
	if((result.search.minDate == flickrOrigin && result.search.maxDate == result.search.now) && result.totalPhotos >= startingNumImages)
	{
		result.search.repeatMode = true;
	}
	if(result.totalPhotos < startingNumImages && !MOCK)
	{
		if((result.search.minDate == flickrOrigin && result.search.maxDate == result.search.now) || (result.search.chooseDate && result.search.minDate == result.search.origMinDate && result.search.maxDate == result.search.origMaxDate))
		{
			// we can't expand the date range
			if(result.totalPhotos == 0)
			{
				message = "Sorry, no images were found with the selected criteria.";
				if(result.search.textTag != null)
				{
					message += "<br>Try searching for broader terms, or no text at all."
				}
				else if(result.search.chooseDate)
				{
					message += "<br>Try searching for a larger range of dates.";
				}
				else if(result.search.currentColors.length > 0)
				{
					message += "<br>Try searching for fewer colors, or clearing your color selections.";
				}
				else if(result.search.currentStyles.length > 0)
				{
					message += "<br>Try searching for fewer styles, or clearing your style selections.";
				}
				messageOutput(message);
				enableButtonHideBar();
				return null;
			}
			else
			{
				messageOutput(startingNumImages + " requested, but only " + result.totalPhotos + " were found. Returning all " + result.totalPhotos + ".");
				var diff = startingNumImages - result.totalPhotos;
				numImages = numImages - diff;
				startingNumImages = result.totalPhotos;
				result.search.chooseRandom = false;
				updateProgressBar(startingNumImages - numImages, startingNumImages);
			}
		}
		else
		{
			if(DEBUG)
			{
				console.log("Not enough photos, so expand the date range.");
			}
			var newDates = expandDateRange(result.search);
			result.search.minDate = newDates[0];
			result.search.maxDate = newDates[1];
			mainSearch(result.search);
			return null;
		}
	}
	return result;
}

function pickImage(result)
{
	if(DEBUG)
	{
		console.log("-pickImage-");
		console.log(result);
	}
	result.totalPhotos = parseInt(result.listObj.total);
	if(result.totalPhotos > 4000)
	{
		result.totalPhotos = 4000; // Flickr lies. It never returns more than 4000. So only pick one of those.
	}
	var photo = new Photo();
	photo.result = result;
	var photos = [];
	if(result.search.chooseRandom && !result.search.repeatMode)
	{
		var randomImage = Math.floor(Math.random() * result.totalPhotos);
		photo.index = randomImage;
		var pageNumber = Math.floor((photo.index + 1) / itemsPerPage) + 1;
		photos.push({photo: photo, pageNumber: pageNumber});
	}
	else if(result.search.chooseRandom && result.search.repeatMode)
	{
		result.indexArray = [];
		for(var i = 0; i < totalPhotos; i++)
		{
			result.indexArray.push(i);
		}
		result.indexArray = shuffle(result.indexArray);
		for(var i = 0; i < numImages; i++)
		{
			photo = new Photo();
			photo.result = result;
			photo.index = result.indexArray.pop();
			var pageNumber = Math.floor((photo.index + 1) / itemsPerPage) + 1;
			photos.push({photo: photo, pageNumber: pageNumber});
		}
	}
	else
	{
		for(var i = 0; i < numImages; i++)
		{
			photo = new Photo();
			photo.result = result;
			photo.index = i;
			var pageNumber = Math.floor((photo.index + 1) / itemsPerPage) + 1;
			photos.push({photo: photo, pageNumber: pageNumber});
		}
	}
	return photos;
}

function initialSearch(url)
{
	if(MOCK)
	{
		var def = $.Deferred();
	
		var initialResult = def.then(function () {return JSON.parse("{\"photos\":{\"page\":1,\"pages\":1,\"perpage\":100,\"total\":\"13\",\"photo\":[{\"id\":\"7743754304\",\"owner\":\"54527470@N00\",\"secret\":\"0102208b87\",\"server\":\"8431\",\"farm\":9,\"title\":\"Chiton (Class Polyplacophora)\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743753536\",\"owner\":\"54527470@N00\",\"secret\":\"396990890b\",\"server\":\"7121\",\"farm\":8,\"title\":\"Chitons (Class Polyplacophora)\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743548532\",\"owner\":\"37935394@N00\",\"secret\":\"c23ea9d339\",\"server\":\"8431\",\"farm\":9,\"title\":\"Vertical I\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743389832\",\"owner\":\"65880921@N05\",\"secret\":\"edc6fce332\",\"server\":\"8287\",\"farm\":9,\"title\":\"Angles.\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743226920\",\"owner\":\"7259240@N03\",\"secret\":\"4587430da2\",\"server\":\"8428\",\"farm\":9,\"title\":\"See Birds (Sun)\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743138248\",\"owner\":\"76800202@N04\",\"secret\":\"bbf6b7cee8\",\"server\":\"8439\",\"farm\":9,\"title\":\"\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7742987764\",\"owner\":\"7173032@N07\",\"secret\":\"4a6f028df0\",\"server\":\"7251\",\"farm\":8,\"title\":\"bgarden 043\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7742976498\",\"owner\":\"29365083@N06\",\"secret\":\"f768de0deb\",\"server\":\"7280\",\"farm\":8,\"title\":\"SECC Walkway\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7742974920\",\"owner\":\"22711505@N05\",\"secret\":\"d68b025b40\",\"server\":\"8433\",\"farm\":9,\"title\":\"Wildflower Field near Lake Thomas -- Sea Pines Forest Preserve on Hilton Head Island (SC) July 2012\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743928752\",\"owner\":\"9751269@N07\",\"secret\":\"57350fda66\",\"server\":\"8299\",\"farm\":9,\"title\":\"\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743725052\",\"owner\":\"29010210@N05\",\"secret\":\"623235fba5\",\"server\":\"7276\",\"farm\":8,\"title\":\"IMG_3049\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743694770\",\"owner\":\"28110584@N04\",\"secret\":\"7c8923a05b\",\"server\":\"8285\",\"farm\":9,\"title\":\"Terracotta Warriors: Hares\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743112598\",\"owner\":\"44564547@N00\",\"secret\":\"ee88e82ace\",\"server\":\"8435\",\"farm\":9,\"title\":\"Olympics Day 12 - Sky Line Emirates\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0}]},\"stat\":\"ok\"}")});
	
		def.resolve();
	
		return initialResult;
	}
	else
	{
		return $.ajax({
			method: "POST",
			url: url
		});
	}
}

function pageSearch(url)
{
	if(MOCK)
	{
		var def = $.Deferred();
	
		var initialResult = def.then(function () {return JSON.parse("{\"photos\":{\"page\":1,\"pages\":1,\"perpage\":100,\"total\":\"13\",\"photo\":[{\"id\":\"7743754304\",\"owner\":\"54527470@N00\",\"secret\":\"0102208b87\",\"server\":\"8431\",\"farm\":9,\"title\":\"Chiton (Class Polyplacophora)\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743753536\",\"owner\":\"54527470@N00\",\"secret\":\"396990890b\",\"server\":\"7121\",\"farm\":8,\"title\":\"Chitons (Class Polyplacophora)\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743548532\",\"owner\":\"37935394@N00\",\"secret\":\"c23ea9d339\",\"server\":\"8431\",\"farm\":9,\"title\":\"Vertical I\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743389832\",\"owner\":\"65880921@N05\",\"secret\":\"edc6fce332\",\"server\":\"8287\",\"farm\":9,\"title\":\"Angles.\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743226920\",\"owner\":\"7259240@N03\",\"secret\":\"4587430da2\",\"server\":\"8428\",\"farm\":9,\"title\":\"See Birds (Sun)\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743138248\",\"owner\":\"76800202@N04\",\"secret\":\"bbf6b7cee8\",\"server\":\"8439\",\"farm\":9,\"title\":\"\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7742987764\",\"owner\":\"7173032@N07\",\"secret\":\"4a6f028df0\",\"server\":\"7251\",\"farm\":8,\"title\":\"bgarden 043\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7742976498\",\"owner\":\"29365083@N06\",\"secret\":\"f768de0deb\",\"server\":\"7280\",\"farm\":8,\"title\":\"SECC Walkway\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7742974920\",\"owner\":\"22711505@N05\",\"secret\":\"d68b025b40\",\"server\":\"8433\",\"farm\":9,\"title\":\"Wildflower Field near Lake Thomas -- Sea Pines Forest Preserve on Hilton Head Island (SC) July 2012\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743928752\",\"owner\":\"9751269@N07\",\"secret\":\"57350fda66\",\"server\":\"8299\",\"farm\":9,\"title\":\"\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743725052\",\"owner\":\"29010210@N05\",\"secret\":\"623235fba5\",\"server\":\"7276\",\"farm\":8,\"title\":\"IMG_3049\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743694770\",\"owner\":\"28110584@N04\",\"secret\":\"7c8923a05b\",\"server\":\"8285\",\"farm\":9,\"title\":\"Terracotta Warriors: Hares\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},{\"id\":\"7743112598\",\"owner\":\"44564547@N00\",\"secret\":\"ee88e82ace\",\"server\":\"8435\",\"farm\":9,\"title\":\"Olympics Day 12 - Sky Line Emirates\",\"ispublic\":1,\"isfriend\":0,\"isfamily\":0}]},\"stat\":\"ok\"}")});
	
		def.resolve();
	
		return initialResult;
	}
	else
	{
		return $.ajax({
			method: "POST",
			url: url
		});	
	}
}

function infoSearch(url)
{
	if(MOCK)
	{
		var def = $.Deferred();
		var initialResult;
		
		var i = Math.floor(Math.random() * 10);
		
		switch(i)
		{
			case 0:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"photo\":{\"id\":\"8622540963\",\"secret\":\"9ba4a8a5ec\",\"server\":\"8108\",\"farm\":9,\"dateuploaded\":\"1365210635\",\"isfavorite\":0,\"license\":\"9\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"9066f429c1\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"88123769@N02\",\"username\":\"Bernard Spragg\",\"realname\":\"Bernard Spragg. NZ\",\"location\":\"Christchurch, New Zealand\",\"iconserver\":\"8182\",\"iconfarm\":9,\"path_alias\":\"volvob12b\"},\"title\":{\"_content\":\"Tulips (2)\"},\"description\":{\"_content\":\"\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1365210635\",\"taken\":\"2011-10-20 10:37:48\",\"takengranularity\":\"0\",\"takenunknown\":0,\"lastupdate\":\"1521943680\"},\"views\":\"2008\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":0},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[{\"id\":\"88103421-8622540963-4264\",\"author\":\"88123769@N02\",\"authorname\":\"Bernard Spragg\",\"raw\":\"Tulips\",\"_content\":\"tulips\",\"machine_tag\":0},{\"id\":\"88103421-8622540963-140\",\"author\":\"88123769@N02\",\"authorname\":\"Bernard Spragg\",\"raw\":\"flowers\",\"_content\":\"flowers\",\"machine_tag\":0},{\"id\":\"88103421-8622540963-227\",\"author\":\"88123769@N02\",\"authorname\":\"Bernard Spragg\",\"raw\":\"Red\",\"_content\":\"red\",\"machine_tag\":0},{\"id\":\"88103421-8622540963-26299\",\"author\":\"88123769@N02\",\"authorname\":\"Bernard Spragg\",\"raw\":\"Blooms\",\"_content\":\"blooms\",\"machine_tag\":0},{\"id\":\"88103421-8622540963-2620\",\"author\":\"88123769@N02\",\"authorname\":\"Bernard Spragg\",\"raw\":\"Spring\",\"_content\":\"spring\",\"machine_tag\":0},{\"id\":\"88103421-8622540963-3322\",\"author\":\"88123769@N02\",\"authorname\":\"Bernard Spragg\",\"raw\":\"Pretty\",\"_content\":\"pretty\",\"machine_tag\":0},{\"id\":\"88103421-8622540963-136904\",\"author\":\"88123769@N02\",\"authorname\":\"Bernard Spragg\",\"raw\":\"Public domain\",\"_content\":\"publicdomain\",\"machine_tag\":0},{\"id\":\"88103421-8622540963-3879690\",\"author\":\"88123769@N02\",\"authorname\":\"Bernard Spragg\",\"raw\":\"free photos\",\"_content\":\"freephotos\",\"machine_tag\":0}]},\"location\":{\"latitude\":\"-43.531718\",\"longitude\":\"172.627047\",\"accuracy\":\"16\",\"context\":\"0\",\"neighbourhood\":{\"_content\":\"Christchurch Central\",\"place_id\":\"rtRp0t5TWrxL11nEkw\",\"woeid\":\"28676724\"},\"locality\":{\"_content\":\"Christchurch\",\"place_id\":\"M70eStpTUb66XR.V\",\"woeid\":\"2348327\"},\"county\":{\"_content\":\"Christchurch City\",\"place_id\":\"b8JfE7pUV7Ks8TZsGg\",\"woeid\":\"55875854\"},\"region\":{\"_content\":\"Canterbury\",\"place_id\":\"1xjjFtBQV7rYUrxGGQ\",\"woeid\":\"15021751\"},\"country\":{\"_content\":\"New Zealand\",\"place_id\":\"X_2zAGVTUb5..jhXDw\",\"woeid\":\"23424916\"},\"place_id\":\"rtRp0t5TWrxL11nEkw\",\"woeid\":\"28676724\"},\"geoperms\":{\"ispublic\":1,\"iscontact\":0,\"isfriend\":0,\"isfamily\":0},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
					);
				});
				break;
			case 1:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"photo\":{\"id\":\"4536379715\",\"secret\":\"a0f09924f6\",\"server\":\"2731\",\"farm\":3,\"dateuploaded\":\"1271733567\",\"isfavorite\":0,\"license\":\"9\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"ed6976c3d8\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"37996646802@N01\",\"username\":\"cogdogblog\",\"realname\":\"Alan Levine\",\"location\":\"Strawberry, United States\",\"iconserver\":\"7292\",\"iconfarm\":8,\"path_alias\":\"cogdog\"},\"title\":{\"_content\":\"Metal Stilts\"},\"description\":{\"_content\":\"\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1271733567\",\"taken\":\"2010-04-19 15:16:02\",\"takengranularity\":\"0\",\"takenunknown\":0,\"lastupdate\":\"1513621978\"},\"views\":\"256\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":1},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[]},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
					);
				});
				break;
			case 2:
				initialResult = def.then(function () {return JSON.parse(
					"{\"photo\":{\"id\":\"32615532175\",\"secret\":\"057b13bea7\",\"server\":\"763\",\"farm\":1,\"dateuploaded\":\"1485808103\",\"isfavorite\":0,\"license\":\"9\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"325540a800\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"147203363@N08\",\"username\":\"EvilGeniusRBF (Public Domain)\",\"realname\":\"Rose Fischer\",\"location\":\"\",\"iconserver\":\"0\",\"iconfarm\":0,\"path_alias\":null},\"title\":{\"_content\":\"RBF_10-19-2015_1015\"},\"description\":{\"_content\":\"evilgeniusrbf.com\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1485808103\",\"taken\":\"2017-01-30 12:06:40\",\"takengranularity\":0,\"takenunknown\":\"1\",\"lastupdate\":\"1485808116\"},\"views\":\"918\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":0},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[{\"id\":\"147110550-32615532175-136904\",\"author\":\"147203363@N08\",\"authorname\":\"EvilGeniusRBF (Public Domain)\",\"raw\":\"public domain\",\"_content\":\"publicdomain\",\"machine_tag\":0},{\"id\":\"147110550-32615532175-1537\",\"author\":\"147203363@N08\",\"authorname\":\"EvilGeniusRBF (Public Domain)\",\"raw\":\"scrapbooking\",\"_content\":\"scrapbooking\",\"machine_tag\":0},{\"id\":\"147110550-32615532175-1464811\",\"author\":\"147203363@N08\",\"authorname\":\"EvilGeniusRBF (Public Domain)\",\"raw\":\"digital paper\",\"_content\":\"digitalpaper\",\"machine_tag\":0}]},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
				);});
				break;
			case 3:
				initialResult = def.then(function () {return JSON.parse(
					"{\"photo\":{\"id\":\"30413821404\",\"secret\":\"35979d045d\",\"server\":\"5608\",\"farm\":6,\"dateuploaded\":\"1480091405\",\"isfavorite\":0,\"license\":\"9\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"20a42645a2\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"134679901@N08\",\"username\":\"vieninsweden\",\"realname\":\"Vien Hoang\",\"location\":\"Gothenburg, Sweden\",\"iconserver\":\"8561\",\"iconfarm\":9,\"path_alias\":\"vieninsweden\"},\"title\":{\"_content\":\"Two Holes in Wood Texture\"},\"description\":{\"_content\":\"\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1480091405\",\"taken\":\"2016-10-25 14:33:14\",\"takengranularity\":\"0\",\"takenunknown\":\"0\",\"lastupdate\":\"1499509436\"},\"views\":\"1010\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":0},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[{\"id\":\"134587088-30413821404-293\",\"author\":\"134679901@N08\",\"authorname\":\"vieninsweden\",\"raw\":\"black and white\",\"_content\":\"blackandwhite\",\"machine_tag\":0},{\"id\":\"134587088-30413821404-1077\",\"author\":\"134679901@N08\",\"authorname\":\"vieninsweden\",\"raw\":\"close-up\",\"_content\":\"closeup\",\"machine_tag\":0},{\"id\":\"134587088-30413821404-10239\",\"author\":\"134679901@N08\",\"authorname\":\"vieninsweden\",\"raw\":\"holes\",\"_content\":\"holes\",\"machine_tag\":0},{\"id\":\"134587088-30413821404-274480\",\"author\":\"134679901@N08\",\"authorname\":\"vieninsweden\",\"raw\":\"wood texture\",\"_content\":\"woodtexture\",\"machine_tag\":0}]},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
				);});
				break;
			case 4:
				initialResult = def.then(function () {return JSON.parse(
					"{\"photo\":{\"id\":\"1401518827\",\"secret\":\"42db5c8fff\",\"server\":\"1003\",\"farm\":2,\"dateuploaded\":\"1190121241\",\"isfavorite\":0,\"license\":\"9\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"161658e3e7\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"44124284226@N01\",\"username\":\"mlinksva\",\"realname\":\"Mike Linksvayer\",\"location\":\"Oakland, California\",\"iconserver\":\"1237\",\"iconfarm\":2,\"path_alias\":\"mlinksva\"},\"title\":{\"_content\":\"dsc02112.jpg\"},\"description\":{\"_content\":\"\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1190121241\",\"taken\":\"2007-09-17 08:13:31\",\"takengranularity\":\"0\",\"takenunknown\":0,\"lastupdate\":\"1427761544\"},\"views\":\"83\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":1},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[{\"id\":\"20414-1401518827-4260\",\"author\":\"44124284226@N01\",\"authorname\":\"mlinksva\",\"raw\":\"geneva\",\"_content\":\"geneva\",\"machine_tag\":0},{\"id\":\"20414-1401518827-69332\",\"author\":\"44124284226@N01\",\"authorname\":\"mlinksva\",\"raw\":\"wipo\",\"_content\":\"wipo\",\"machine_tag\":0},{\"id\":\"20414-1401518827-10448\",\"author\":\"44124284226@N01\",\"authorname\":\"mlinksva\",\"raw\":\"ceiling\",\"_content\":\"ceiling\",\"machine_tag\":0}]},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
				);});
				break;
			case 5:
				initialResult = def.then(function () {return JSON.parse(
					"{\"photo\":{\"id\":\"1401518827\",\"secret\":\"42db5c8fff\",\"server\":\"1003\",\"farm\":2,\"dateuploaded\":\"1190121241\",\"isfavorite\":0,\"license\":\"9\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"161658e3e7\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"44124284226@N01\",\"username\":\"mlinksva\",\"realname\":\"Mike Linksvayer\",\"location\":\"Oakland, California\",\"iconserver\":\"1237\",\"iconfarm\":2,\"path_alias\":\"mlinksva\"},\"title\":{\"_content\":\"dsc02112.jpg\"},\"description\":{\"_content\":\"\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1190121241\",\"taken\":\"2007-09-17 08:13:31\",\"takengranularity\":\"0\",\"takenunknown\":0,\"lastupdate\":\"1427761544\"},\"views\":\"83\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":1},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[{\"id\":\"20414-1401518827-4260\",\"author\":\"44124284226@N01\",\"authorname\":\"mlinksva\",\"raw\":\"geneva\",\"_content\":\"geneva\",\"machine_tag\":0},{\"id\":\"20414-1401518827-69332\",\"author\":\"44124284226@N01\",\"authorname\":\"mlinksva\",\"raw\":\"wipo\",\"_content\":\"wipo\",\"machine_tag\":0},{\"id\":\"20414-1401518827-10448\",\"author\":\"44124284226@N01\",\"authorname\":\"mlinksva\",\"raw\":\"ceiling\",\"_content\":\"ceiling\",\"machine_tag\":0}]},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
				);});
				break;
			case 6:
				initialResult = def.then(function () {return JSON.parse(
					"{\"photo\":{\"id\":\"5524178619\",\"secret\":\"aa17b7fdd7\",\"server\":\"5015\",\"farm\":6,\"dateuploaded\":\"1300064356\",\"isfavorite\":0,\"license\":\"9\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"e3c2e4876c\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"29507259@N02\",\"username\":\"D Coetzee\",\"realname\":\"D Coetzee\",\"location\":\"San Mateo, CA, USA\",\"iconserver\":\"4546\",\"iconfarm\":5,\"path_alias\":\"dcoetzee\"},\"title\":{\"_content\":\"DSC_3612\"},\"description\":{\"_content\":\"\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1300064356\",\"taken\":\"2009-12-20 16:34:05\",\"takengranularity\":\"0\",\"takenunknown\":0,\"lastupdate\":\"1465827176\"},\"views\":\"2794\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":1},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[]},\"location\":{\"latitude\":\"37.966644\",\"longitude\":\"-122.060084\",\"accuracy\":\"16\",\"context\":\"0\",\"neighbourhood\":{\"_content\":\"Ellinwood\",\"place_id\":\"6U5gRRNUV7OFGt1ukw\",\"woeid\":\"55970400\"},\"locality\":{\"_content\":\"Pleasant Hill\",\"place_id\":\"EPNvqDBTVr3TApxe\",\"woeid\":\"2473909\"},\"county\":{\"_content\":\"Contra Costa\",\"place_id\":\"Svx_fvhQUL8F_EyruA\",\"woeid\":\"12587676\"},\"region\":{\"_content\":\"California\",\"place_id\":\"NsbUWfBTUb4mbyVu\",\"woeid\":\"2347563\"},\"country\":{\"_content\":\"United States\",\"place_id\":\"nz.gsghTUb4c2WAecA\",\"woeid\":\"23424977\"},\"place_id\":\"6U5gRRNUV7OFGt1ukw\",\"woeid\":\"55970400\"},\"geoperms\":{\"ispublic\":1,\"iscontact\":0,\"isfriend\":0,\"isfamily\":0},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
				);});
				break;
			case 7:
				initialResult = def.then(function () {return JSON.parse(
					"{\"photo\":{\"id\":\"16131161778\",\"secret\":\"539ebb9cc0\",\"server\":\"7543\",\"farm\":8,\"dateuploaded\":\"1421686003\",\"isfavorite\":0,\"license\":\"10\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"5ba34c1172\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"85763206@N00\",\"username\":\"liza31337\",\"realname\":\"Liza\",\"location\":\"Somerville, MA, USA\",\"iconserver\":\"21\",\"iconfarm\":1,\"path_alias\":\"lizadaly\"},\"title\":{\"_content\":\"multiply-14742766486.png.jpg\"},\"description\":{\"_content\":\"\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1421686003\",\"taken\":\"2015-01-19 11:37:53\",\"takengranularity\":0,\"takenunknown\":\"1\",\"lastupdate\":\"1534338966\"},\"views\":\"2462\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":0},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[{\"id\":\"475067-16131161778-75987685\",\"author\":\"85763206@N00\",\"authorname\":\"liza31337\",\"raw\":\"machine-generated\",\"_content\":\"machinegenerated\",\"machine_tag\":0},{\"id\":\"475067-16131161778-100830\",\"author\":\"85763206@N00\",\"authorname\":\"liza31337\",\"raw\":\"procedural\",\"_content\":\"procedural\",\"machine_tag\":0},{\"id\":\"475067-16131161778-8526\",\"author\":\"85763206@N00\",\"authorname\":\"liza31337\",\"raw\":\"commons\",\"_content\":\"commons\",\"machine_tag\":0}]},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
				);});
				break;
			case 8:
				initialResult = def.then(function () {return JSON.parse(
					"{\"photo\":{\"id\":\"5652608486\",\"secret\":\"fd2a4e98dc\",\"server\":\"5263\",\"farm\":6,\"dateuploaded\":\"1303707027\",\"isfavorite\":0,\"license\":\"10\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"966af91be7\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"61218143@N04\",\"username\":\"Babij\",\"realname\":\"\",\"location\":\"Pu\u0142awy, Poland\",\"iconserver\":\"4590\",\"iconfarm\":5,\"path_alias\":null},\"title\":{\"_content\":\"IMGP7421\"},\"description\":{\"_content\":\"\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1303707027\",\"taken\":\"2011-04-24 21:50:27\",\"takengranularity\":\"0\",\"takenunknown\":\"0\",\"lastupdate\":\"1484114305\"},\"views\":\"94\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":0},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[]},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
				);});
				break;
			default:
				initialResult = def.then(function () {return JSON.parse(
					"{\"photo\":{\"id\":\"14511242028\",\"secret\":\"4cc4481795\",\"server\":\"2924\",\"farm\":3,\"dateuploaded\":\"1405853090\",\"isfavorite\":0,\"license\":\"10\",\"safety_level\":\"0\",\"rotation\":0,\"originalsecret\":\"58dd827e56\",\"originalformat\":\"jpg\",\"owner\":{\"nsid\":\"30924550@N04\",\"username\":\"walmarc04\",\"realname\":\"Marcu Ioachim\",\"location\":\"Romania\",\"iconserver\":\"380\",\"iconfarm\":1,\"path_alias\":\"ioachimphotos\"},\"title\":{\"_content\":\"Walk through Munich\"},\"description\":{\"_content\":\"street photography\"},\"visibility\":{\"ispublic\":1,\"isfriend\":0,\"isfamily\":0},\"dates\":{\"posted\":\"1405853090\",\"taken\":\"2014-04-30 04:01:22\",\"takengranularity\":\"0\",\"takenunknown\":0,\"lastupdate\":\"1475476165\"},\"views\":\"1065\",\"editability\":{\"cancomment\":0,\"canaddmeta\":0},\"publiceditability\":{\"cancomment\":1,\"canaddmeta\":0},\"usage\":{\"candownload\":1,\"canblog\":0,\"canprint\":0,\"canshare\":1},\"comments\":{\"_content\":\"0\"},\"notes\":{\"note\":[]},\"people\":{\"haspeople\":0},\"tags\":{\"tag\":[{\"id\":\"30892411-14511242028-5196\",\"author\":\"30924550@N04\",\"authorname\":\"walmarc04\",\"raw\":\"walk\",\"_content\":\"walk\",\"machine_tag\":0},{\"id\":\"30892411-14511242028-78249\",\"author\":\"30924550@N04\",\"authorname\":\"walmarc04\",\"raw\":\"Germania\",\"_content\":\"germania\",\"machine_tag\":0},{\"id\":\"30892411-14511242028-3181\",\"author\":\"30924550@N04\",\"authorname\":\"walmarc04\",\"raw\":\"holidays\",\"_content\":\"holidays\",\"machine_tag\":0},{\"id\":\"30892411-14511242028-85\",\"author\":\"30924550@N04\",\"authorname\":\"walmarc04\",\"raw\":\"street\",\"_content\":\"street\",\"machine_tag\":0},{\"id\":\"30892411-14511242028-1935\",\"author\":\"30924550@N04\",\"authorname\":\"walmarc04\",\"raw\":\"photography\",\"_content\":\"photography\",\"machine_tag\":0}]},\"urls\":{\"url\":[{\"type\":\"photopage\",\"_content\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/\"}]},\"media\":\"photo\"},\"stat\":\"ok\"}"
				);});
				break;
		}
		def.resolve();
		return initialResult;
	}
	else
	{
		return $.ajax({
			method: "POST",
			url: url
		});
	}
}

function sizeSearch(url)
{
	if(MOCK)
	{
		var def = $.Deferred();
		var initialResult;
	
		var i = Math.floor(Math.random() * 10);
		switch(i)
		{
			case 0:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"67\",\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"162\",\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":216,\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"337\",\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":\"431\",\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Medium 800\",\"width\":\"800\",\"height\":539,\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec_c.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/c\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"690\",\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9ba4a8a5ec_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Large 1600\",\"width\":\"1600\",\"height\":1078,\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_e4a6765b72_h.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/h\/\",\"media\":\"photo\"},{\"label\":\"Large 2048\",\"width\":\"2048\",\"height\":1380,\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_623375a1a1_k.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/k\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"2400\",\"height\":\"1617\",\"source\":\"https:\/\/farm9.staticflickr.com\/8108\/8622540963_9066f429c1_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/volvob12b\/8622540963\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			case 1:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_a0f09924f6_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_a0f09924f6_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"67\",\"height\":\"100\",\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_a0f09924f6_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"160\",\"height\":\"240\",\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_a0f09924f6_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":213,\"height\":\"320\",\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_a0f09924f6_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"333\",\"height\":\"500\",\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_a0f09924f6.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"426\",\"height\":\"640\",\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_a0f09924f6_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"681\",\"height\":\"1024\",\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_a0f09924f6_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"1581\",\"height\":\"2376\",\"source\":\"https:\/\/farm3.staticflickr.com\/2731\/4536379715_ed6976c3d8_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/cogdog\/4536379715\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			case 2:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"100\",\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"240\",\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":320,\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"500\",\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":\"640\",\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Medium 800\",\"width\":\"800\",\"height\":800,\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7_c.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/c\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"1024\",\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_057b13bea7_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Large 1600\",\"width\":\"1600\",\"height\":1600,\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_47445d1c60_h.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/h\/\",\"media\":\"photo\"},{\"label\":\"Large 2048\",\"width\":\"2048\",\"height\":2048,\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_d137ff93ab_k.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/k\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"4200\",\"height\":\"4200\",\"source\":\"https:\/\/farm1.staticflickr.com\/763\/32615532175_325540a800_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/147203363@N08\/32615532175\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			case 3:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"67\",\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"160\",\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":213,\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"333\",\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":\"427\",\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Medium 800\",\"width\":\"800\",\"height\":534,\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d_c.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/c\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"683\",\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_35979d045d_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Large 1600\",\"width\":\"1600\",\"height\":1067,\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_55b6ba4ad4_h.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/h\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"1920\",\"height\":\"1280\",\"source\":\"https:\/\/farm6.staticflickr.com\/5608\/30413821404_20a42645a2_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/vieninsweden\/30413821404\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			case 4:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_42db5c8fff_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_42db5c8fff_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"75\",\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_42db5c8fff_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"180\",\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_42db5c8fff_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":240,\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_42db5c8fff_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"375\",\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_42db5c8fff.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":480,\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_42db5c8fff_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"768\",\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_42db5c8fff_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"2816\",\"height\":\"2112\",\"source\":\"https:\/\/farm2.staticflickr.com\/1003\/1401518827_161658e3e7_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/mlinksva\/1401518827\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			case 5:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"70\",\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"168\",\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":223,\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"349\",\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":\"447\",\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Medium 800\",\"width\":\"800\",\"height\":559,\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff_c.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/c\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"715\",\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_32d99f5aff_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Large 1600\",\"width\":\"1600\",\"height\":1118,\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_318d71fa42_h.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/h\/\",\"media\":\"photo\"},{\"label\":\"Large 2048\",\"width\":\"2048\",\"height\":1431,\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_2e6c5afd18_k.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/k\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"4270\",\"height\":\"2983\",\"source\":\"https:\/\/farm1.staticflickr.com\/283\/31805893333_154493c209_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/100818627@N02\/31805893333\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			case 6:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_aa17b7fdd7_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_aa17b7fdd7_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"66\",\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_aa17b7fdd7_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"159\",\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_aa17b7fdd7_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":213,\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_aa17b7fdd7_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"332\",\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_aa17b7fdd7.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":\"425\",\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_aa17b7fdd7_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"680\",\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_aa17b7fdd7_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"4288\",\"height\":\"2848\",\"source\":\"https:\/\/farm6.staticflickr.com\/5015\/5524178619_e3c2e4876c_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/dcoetzee\/5524178619\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			case 7:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"60\",\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"145\",\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":193,\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"302\",\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":\"386\",\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Medium 800\",\"width\":\"800\",\"height\":483,\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0_c.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/c\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"618\",\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_539ebb9cc0_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Large 1600\",\"width\":\"1600\",\"height\":966,\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_c2bd004ae4_h.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/h\/\",\"media\":\"photo\"},{\"label\":\"Large 2048\",\"width\":\"2048\",\"height\":1236,\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_241dfd6085_k.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/k\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"2578\",\"height\":\"1556\",\"source\":\"https:\/\/farm8.staticflickr.com\/7543\/16131161778_5ba34c1172_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/lizadaly\/16131161778\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			case 8:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_fd2a4e98dc_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_fd2a4e98dc_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"100\",\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_fd2a4e98dc_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"240\",\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_fd2a4e98dc_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":320,\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_fd2a4e98dc_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"500\",\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_fd2a4e98dc.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":\"640\",\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_fd2a4e98dc_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"1024\",\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_fd2a4e98dc_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"1024\",\"height\":\"1024\",\"source\":\"https:\/\/farm6.staticflickr.com\/5263\/5652608486_966af91be7_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/61218143@N04\/5652608486\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
			default:
				initialResult = def.then(function()
				{
					return JSON.parse(
						"{\"sizes\":{\"canblog\":0,\"canprint\":0,\"candownload\":1,\"size\":[{\"label\":\"Square\",\"width\":75,\"height\":75,\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795_s.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/sq\/\",\"media\":\"photo\"},{\"label\":\"Large Square\",\"width\":\"150\",\"height\":\"150\",\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795_q.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/q\/\",\"media\":\"photo\"},{\"label\":\"Thumbnail\",\"width\":\"100\",\"height\":\"67\",\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795_t.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/t\/\",\"media\":\"photo\"},{\"label\":\"Small\",\"width\":\"240\",\"height\":\"160\",\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795_m.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/s\/\",\"media\":\"photo\"},{\"label\":\"Small 320\",\"width\":\"320\",\"height\":213,\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795_n.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/n\/\",\"media\":\"photo\"},{\"label\":\"Medium\",\"width\":\"500\",\"height\":\"333\",\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/m\/\",\"media\":\"photo\"},{\"label\":\"Medium 640\",\"width\":\"640\",\"height\":\"427\",\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795_z.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/z\/\",\"media\":\"photo\"},{\"label\":\"Medium 800\",\"width\":\"800\",\"height\":534,\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795_c.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/c\/\",\"media\":\"photo\"},{\"label\":\"Large\",\"width\":\"1024\",\"height\":\"683\",\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_4cc4481795_b.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/l\/\",\"media\":\"photo\"},{\"label\":\"Large 1600\",\"width\":\"1600\",\"height\":1067,\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_bdd5db514e_h.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/h\/\",\"media\":\"photo\"},{\"label\":\"Large 2048\",\"width\":\"2048\",\"height\":1365,\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_aff0b7eea4_k.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/k\/\",\"media\":\"photo\"},{\"label\":\"Original\",\"width\":\"4608\",\"height\":\"3072\",\"source\":\"https:\/\/farm3.staticflickr.com\/2924\/14511242028_58dd827e56_o.jpg\",\"url\":\"https:\/\/www.flickr.com\/photos\/ioachimphotos\/14511242028\/sizes\/o\/\",\"media\":\"photo\"}]},\"stat\":\"ok\"}"
					);
				});
				break;
		}
		def.resolve();
		return initialResult;
	}
	else
	{
		return $.ajax({
			method: "POST",
			url: url
		});
	}
}

function getPhoto(photo, pageNumber)
{
	if(DEBUG)
	{
		console.log("-getPhoto-");
		console.log(photo);
		console.log(pageNumber);
	}
	var def = $.Deferred();
	def.resolve();
	numImages--;
	if(pageNumber == 1 && !MOCK)
	{
		photo.imageObj = photo.result.listObj.photo[photo.index];
		return def.then(function() {return processPhoto(photo)});
	}
	else
	{
		var strings = getSearchStrings(photo.result.search);

		var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + flickrAPIKey + "&license=" + photo.result.search.currentLicenses.join() + strings.minDateString + strings.maxDateString + strings.textTagString + strings.useridString + strings.colors + strings.styles + strings.orientations + strings.safeSearch + strings.minSizeString + strings.mediaTypeString + "&per_page=" + itemsPerPage + "&page=" + pageNumber + "&format=json&nojsoncallback=1";
		if(DEBUG)
		{
			console.log("pageSearch url");
			console.log(url);
		}
		return pageSearch(url).then(function(message)
		{
			return processPhotoResult(photo, message);
		});
	}
}

function processPhoto(photo)
{
	if(DEBUG)
	{
		console.log("-processPhoto-");
		console.log(photo);
	}
	var def = $.Deferred();
	
	def.resolve();
	if((photo.result.listObj.photo.length - 1) < (photo.index % itemsPerPage))
	{
		// For some reason, Flickr's API didn't return as many images as it said it would.
		if(photo.result.search.chooseDate) // user chose the date, so let them know there aren't as many as we thought
		{
			if(photo.result.search.minDate == photo.result.search.origMinDate && photo.result.search.maxDate == photo.result.search.origMaxDate)
			{
				messageOutput("Flickr error: API call returned fewer images than it said it would. RFP doesn't know what to do.");
				return def.then(function () {return null;});
			}
			else
			{
				var newDates = expandDateRange(photo.result.search);
				photo.result.search.minDate = newDates[0];
				photo.result.search.maxDate = newDates[1];
				mainSearch(photo.result.search);
				return def.then(function () {return null;});
			}
		}
		else // we chose the date, just expand the range
		{
			if(photo.result.repeatMode)
			{
				photo.index = photo.result.indexArray.pop();
				if(photo.index == undefined)
				{
					messageOutput("Flickr error: API call returned fewer images than it said it would. RFP doesn't know what to do.");
					return def.then(function () {return null;});
				}
				var pageNumber = Math.floor((photo.index + 1) / itemsPerPage) + 1;
				return getPhoto(photo, pageNumber);
			}
			if(photo.result.listObj.photo.length == 0)
			{
				if(photo.result.search.minDate == flickrOrigin && photo.result.search.maxDate == photo.result.search.now)
				{
					messageOutput("Flickr error: API call returned fewer images than it said it would.");
					return def.then(function () {return null;});
				}
				else
				{
					var newDates = expandDateRange(photo.result.search);
					photo.result.search.minDate = newDates[0];
					photo.result.search.maxDate = newDates[1];
					mainSearch(photo.result.search);
					return def.then(function () {return null;});
				}
			}
			else
			{
				var randImageIndex = Math.floor(Math.random() * photo.result.listObj.photo.length);
				photo.imageObj = photo.result.listObj.photo[randImageIndex];
				return def.then(function () {return photo;});
			}
		}
	}
	else
	{
        photo.imageObj = photo.result.listObj.photo[(photo.index % itemsPerPage)];
		return def.then(function () {return photo;});
	}
}

function processPhotoResult(photo, msg)
{
	if(DEBUG)
	{
		console.log("-processPhotoResult-");
		console.log(photo);
		console.log(msg);
	}
	var def = $.Deferred();
	
	def.resolve();

	if(msg != null)
	{
		if(typeof msg.stat !== "undefined" && msg.stat == "fail")
		{
			messageOutput("Flickr error: " + msg.message);
			return def.then(function () {return null;});
		}
		else
		{
			photo.result.listObj = msg.photos;
		}
	}
	return def.then(function() {return processPhoto(photo)});
}

function getLicenses()
{
	if(MOCK)
	{
		licenseList = JSON.parse("{\"licenses\":{\"license\":[{\"id\":\"0\",\"name\":\"All Rights Reserved\",\"url\":\"\"},{\"id\":\"4\",\"name\":\"Attribution License\",\"url\":\"https:\\\/\\\/creativecommons.org\\\/licenses\\\/by\\\/2.0\\\/\"},{\"id\":\"6\",\"name\":\"Attribution-NoDerivs License\",\"url\":\"https:\\\/\\\/creativecommons.org\\\/licenses\\\/by-nd\\\/2.0\\\/\"},{\"id\":\"3\",\"name\":\"Attribution-NonCommercial-NoDerivs License\",\"url\":\"https:\\\/\\\/creativecommons.org\\\/licenses\\\/by-nc-nd\\\/2.0\\\/\"},{\"id\":\"2\",\"name\":\"Attribution-NonCommercial License\",\"url\":\"https:\\\/\\\/creativecommons.org\\\/licenses\\\/by-nc\\\/2.0\\\/\"},{\"id\":\"1\",\"name\":\"Attribution-NonCommercial-ShareAlike License\",\"url\":\"https:\\\/\\\/creativecommons.org\\\/licenses\\\/by-nc-sa\\\/2.0\\\/\"},{\"id\":\"5\",\"name\":\"Attribution-ShareAlike License\",\"url\":\"https:\\\/\\\/creativecommons.org\\\/licenses\\\/by-sa\\\/2.0\\\/\"},{\"id\":\"7\",\"name\":\"No known copyright restrictions\",\"url\":\"https:\\\/\\\/www.flickr.com\\\/commons\\\/usage\\\/\"},{\"id\":\"8\",\"name\":\"United States Government Work\",\"url\":\"http:\\\/\\\/www.usa.gov\\\/copyright.shtml\"},{\"id\":\"9\",\"name\":\"Public Domain Dedication (CC0)\",\"url\":\"https:\\\/\\\/creativecommons.org\\\/publicdomain\\\/zero\\\/1.0\\\/\"},{\"id\":\"10\",\"name\":\"Public Domain Mark\",\"url\":\"https:\\\/\\\/creativecommons.org\\\/publicdomain\\\/mark\\\/1.0\\\/\"}]},\"stat\":\"ok\"}");
		licenseList = licenseList.licenses.license;
		licenseList.sort(function(a, b)
		{
			if(a.name < b.name)
			{
				return -1;
			}
			if(a.name > b.name)
			{
				return 1;
			}
			return 0;
		});

		populateForm(licenseList);
	}
	else
	{
		$.ajax({
			method: "POST",
			url: "https://api.flickr.com/services/rest/?method=flickr.photos.licenses.getInfo&api_key=" + flickrAPIKey + "&format=json&nojsoncallback=1"
		}).done(function(msg) {
			if(typeof msg.stat !== "undefined" && msg.stat == "fail")
			{
				messageOutput("Flickr error: " + msg.message);
			}
			else
			{
				licenseList = msg.licenses.license;
				licenseList.sort(function(a, b)
				{
					if(a.name < b.name)
					{
						return -1;
					}
					if(a.name > b.name)
					{
						return 1;
					}
					return 0;
				});
				populateForm(licenseList);
			}
		});
	}
}

/* End Search */

/* Input */

function submitForm()
{
	$("#messageHolder").html('');
	numberOfCollisions = 0;
    var search = new Search();
	var chooseRandom = true;
	if($("input[type='radio'][name='selectionType']:checked").val() == 'first')
	{
		chooseRandom = false;
	}
	var numImagesToGet = 0;
	switch($("input[type='radio'][name='numImages']:checked").val())
	{
		case "X":
			numImagesToGet = parseInt($('#numImagesBox').val());
			break;
		default:
			numImagesToGet = $("input[type='radio'][name='numImages']:checked").val();
			break;
	}
	numImages = numImagesToGet;
	startingNumImages = numImages;
	imagesReturned = 0;
	$("#imagesReturned").show();
	updateHeaderPadding();
	updateProgressBar(0, startingNumImages);
	search.chooseRandom = chooseRandom;
	currentQueryIds.length = 0;
	if($("#textTagBox").val() !== "")
	{
		search.textTag = $("#textTagBox").val();
	}
	if($("#useridBox").val() !== "")
	{
		search.userid = $("#useridBox").val();
	}
	selectedLicenses.length = 0;
	$('#licensesBoxes .idBox:checked').each(function() {
		
		selectedLicenses.push($(this).attr('data'));
	});
	if(selectedLicenses.length == 0)
	{
		alert("Error: Choose at least one license.");
		return null;
	}
	search.currentLicenses = selectedLicenses.slice(0);
	if($('#licensesBoxes .idBox').length == $('#licensesBoxes .idBox:checked').length)
	{
		search.currentLicenses = [];
	}
	
	selectedColors.length = 0;
	$('.colorLink.checked').each(function() {
		selectedColors.push($(this).attr("data"));
	});
	
	search.currentColors = selectedColors.slice(0);
	
	selectedStyles.length = 0;
	$('#styleChooser input:checked').each(function()
	{
		selectedStyles.push($(this).val());
	});
	
	search.currentStyles = selectedStyles.slice(0);
	
	selectedOrientations.length = 0;
	$('#orientationChooser input:checked').each(function()
	{
		selectedOrientations.push($(this).val());
	});
	
	if(selectedOrientations.length == 0)
	{
		alert("Error: Choose at least one orientation.");
		return null;
	}
	
	search.currentOrientations = selectedOrientations.slice(0);
	
	var minSize = $('#minSizeChooser input[type=radio]:checked');
	if(minSize.length == 0)
	{
		alert("Error: Select a size value.");
		return null;
	}
	minSize = minSize.val();
	if(minSize == "medium")
	{
		search.minWidth = 640;
		search.minHeight = 640;
	}
	if(minSize == "large")
	{
		search.minWidth = 1024;
		search.minHeight = 1024;
	}
	if(minSize == "custom")
	{
		if($("#sizeWidthBox").val() != "" && !isNaN(parseInt($("#sizeWidthBox").val())))
		{
			search.minWidth = parseInt($("#sizeWidthBox").val());
		}
		if($("#sizeHeightBox").val() != "" && !isNaN(parseInt($("#sizeHeightBox").val())))
		{
			search.minHeight = parseInt($("#sizeHeightBox").val());
		}
	}
	search.mediaType = $("input[type='radio'][name='mediaType']:checked").val();

	search.now = Math.floor((Date.now() - (timeDifferenceMS)) / 1000);

	search.chooseDate = false;
	if($("input[type='radio'][name='dateType']:checked").length == 0)
	{
		alert("Error: Select a Date Range type.");
		return null;
	}
	if($("input[type='radio'][name='safeSearch']:checked").length == 0)
	{
		alert("Error: Select a Safe Search type.");
		return null;
	}
	if($("input[type='radio'][name='mediaType']:checked").length == 0)
	{
		alert("Error: Select a Media Type.");
		return null;
	}
	if($("input[type='radio'][name='dateType']:checked").val() == "choose")
	{
		search.chooseDate = true;
		if($('#startDateTimeBox').val() == "")
		{
			if($('#endDateTimeBox').val() == "")
			{
				alert("Error: Choose start date or select 'Use Random Dates'.");
				return null;
			}
			else
			{
				messageOutput("No start date chosen. Searching all images uploaded before selected end date.");
				search.minDate = flickrOrigin;
			}
		}
		if($('#endDateTimeBox').val() == "")
		{
			messageOutput("No end date chosen. Searching all images uploaded after selected start date.");
			search.maxDate = search.now;
		}
		if(search.minDate == null)
		{
			var minDateString = $('#startDateTimeBox').val().toString();
			search.minDate = Math.round(new Date(minDateString).getTime()/1000);
		}
		if(search.maxDate == null)
		{
			var maxDateString = $('#endDateTimeBox').val().toString();
			search.maxDate = Math.round(new Date(maxDateString).getTime()/1000);
		}
		if(search.maxDate <= search.minDate)
		{
			alert("Error: Choose an end time after the start time or select 'Use Random Dates'.");
			return null;
		}
	}
	if(numImages > 100)
	{
		alert("Warning: This system will only retrieve 100 images maximum.");
		numImages = 100;
		$("#numImagesBox").val(100);
	}
	search.safeSearchLevel = $('input:radio[name="safeSearch"]:checked').val();
	$('#getImages').addClass('disabled');
	$('#cancelSearch').removeClass('disabled');
	return search;
}

$(function() {
	getEnableCookies();

	keyboardeventKeyPolyfill.polyfill();
	$('.colorLink').tooltip();
	$('#enableCookiesLabel').tooltip();
	$('#dateChooser').hide();
	$('#customSizeSection').hide();
	$('.sectionContent').hide();
	$('#startDateBox, #endDateBox').datepicker({
		constrainInput: true,
		dateFormat: "yy-mm-dd",
		gotoCurrent: true
	});
	getAllCookies();
	updateAllText();
    if($('#chooseDate:checked').length > 0)
    {
        $('#dateChooser').show();
    }

	var emailAddr = "cassandra";
	emailAddr += "@" + "gelvins.com";
	$('#emailMe').attr("href", "mailto:" + emailAddr);
	startDateTimeCalendar = $('#startDateTimeBox').datetimepicker({
		icons: {
			time: "far fa-clock",
			date: "far fa-calendar-alt",
			up: "fas fa-chevron-up",
			down: "fas fa-chevron-down",
			previous: 'fas fa-chevron-left',
			next: 'fas fa-chevron-right',
			today: 'far fa-calendar-times',
			clear: 'fas fa-trash',
			close: 'far fa-calendar-minus',
		}
	});
	endDateTimeCalendar = $('#endDateTimeBox').datetimepicker({
		icons: {
			time: "far fa-clock",
			date: "far fa-calendar-alt",
			up: "fas fa-chevron-up",
			down: "fas fa-chevron-down",
			previous: 'fas fa-chevron-left',
			next: 'fas fa-chevron-right',
			today: 'far fa-calendar-times',
			clear: 'fas fa-trash',
			close: 'far fa-calendar-minus',
		}
	});
	$(window).resize(function()
	{
		if(window.innerWidth < 600)
		{
			$('.singleImageHolder').tooltip("disable");
			if(grid != null)
			{
				grid.masonry('destroy');
				grid = null;
			}
		}
		else
		{
			$('.singleImageHolder').tooltip("enable");
			if(grid == null)
			{
				grid = $('#images').masonry(
					{
						itemSelector: '.singleImageHolder',
						percentPosition: true,
						transitionDuration: '0',
					}
				)
			}
		}
		updateHeaderPadding();
	});
	updateHeaderPadding();

	grid = $('#images').masonry(
		{
			itemSelector: '.singleImageHolder',
			percentPosition: true,
			transitionDuration: '0',
		}
	)
});

/* End Input */

/* Output */

function messageOutput(outputString)
{
	$('#messageHolder').append("<div class='message'>" + outputString + "</div>");
}

function populateForm(licenses)
{
	$('#licensesBoxes').html("");

	for(var i = 0; i < licenses.length; i++)
	{
		$('#licensesBoxes').append(
			"<div class='nowrap form-check'>" +
				"<label for='license-" + licenses[i].id + "' class='form-check-label'>" + "<input class='form-check-input idBox' type='checkbox' id='license-" + licenses[i].id + "' name='license-" + licenses[i].id + 
				"' data='" + licenses[i].id + "'>" + licenses[i].name + "<span class='form-check-sign'></span></label>" +
			"</div>"
		);
	}
	
	getCheckboxCookie("licenses", true);
	updateActiveRadioChecks();
	licenseText();
}

function updateReturnedImages()
{
	imagesReturned++;
	updateProgressBar(imagesReturned, startingNumImages);
}

function outputImageData(photo)
{
	if(DEBUG)
	{
		console.log("-outputImageData-");
		console.log(photo);
	}
	if(cancelledSearches.indexOf(photo.result.search.searchId) != -1)
	{
		if(DEBUG)
		{
			console.log("-----This search was cancelled.-----");
		}
		return null;
	}
	updateReturnedImages();
	var username = photo.imageInfoObj.owner.username;
	if(photo.imageInfoObj.owner.realname != "")
	{
		username += " (" + photo.imageInfoObj.owner.realname + ")";
	}
	var datePosted = new Date(photo.imageInfoObj.dateuploaded * 1000);
	var minDateString = new Date(photo.result.search.minDate * 1000);
	minDateString = dateToString(minDateString);
	var maxDateString = new Date(photo.result.search.maxDate * 1000);
	maxDateString = dateToString(maxDateString);
	var origDateString = "";
	if((photo.result.search.minDate != photo.result.search.origMinDate || photo.result.search.maxDate != photo.result.search.origMaxDate))
	{
		var origMinDateString = new Date(photo.result.search.origMinDate * 1000);
		origMinDateString = dateToString(origMinDateString);
		var origMaxDateString = new Date(photo.result.search.origMaxDate * 1000);
		origMaxDateString = dateToString(origMaxDateString);
		origDateString = "<div class='origMinDate'>" +
				"<div class='label'><em>Min Date Set:</em></div> " + origMinDateString +
			"</div>" +
			"<div class='origMaxDate'>" +
				"<div class='label'><em>Max Date Set:</em></div> " + origMaxDateString +
			"</div>";
	}
	var textTagString = "";
	if(photo.result.search.textTag !== null)
	{
		textTagString = "<div class='textTagSearch'>" +
			"<div class='label'><em>Search String:</em></div> " + photo.result.search.textTag +
		"</div>";
	}
	var colorString = "";
	if(photo.result.search.currentColors.length > 0)
	{
		colorString = "<div class='colorSearch'>" +
			"<div class='label'><em>Colors Searched:</em></div> ";
		for(var i = 0; i < photo.result.search.currentColors.length; i++)
		{
			colorString += getColorNameByFlickrId(photo.result.search.currentColors[i]) + ", ";
		}
		colorString = colorString.substr(0, colorString.length - 2);
		colorString += "</div>";
	}
	var styleString = "";
	if(photo.result.search.currentStyles.length > 0)
	{
		styleString = "<div class='styleSearch'>" +
			"<div class='label'><em>Styles Searched:</em></div> ";
		for(var i = 0; i < photo.result.search.currentStyles.length; i++)
		{
			styleString += getStyleNameByFlickrText(photo.result.search.currentStyles[i]) + ", ";
		}
		styleString = styleString.substr(0, styleString.length - 2);
		styleString += "</div>";
	}
	
	
	var imageLicense = getLicenseName(photo.imageInfoObj.license);
	var appendedImage = $("<div class='singleImageHolder'>" +
			"<a href='" + photo.imageInfoObj.urls.url[0]._content + "' target='_blank'>" +
				"<img src='" + getMediumSizeSrc(photo.imageSizeObj) + "'>" +
			"</a></div>");
	displayedImages.push([getOriginalSizeSrc(photo.imageSizeObj), photo.imageInfoObj.urls.url[0]._content]);
	var imageTooltip = $("<div class='imageTextHolder'>" +
			"<div class='imageName'><div class='label'><em>Title:</em></div> " +
				photo.imageInfoObj.title._content +
			"</div>" +
			"<div class='photographerUsername'><div class='label'><em>Artist:</em></div> " +
				username +
			"</div>" +
			"<div class='datePosted'><div class='label'><em>Uploaded:</em></div> " +
				dateToString(datePosted) +
			"</div>" +
			"<div class='license'><div class='label'><em>License:</em></div> " +
				imageLicense +
			"</div>" +
			"<div class='imageSize'><div class='label'><em>Size:</em></div> " +
				getImageWidth(photo.imageSizeObj) + "px x " + getImageHeight(photo.imageSizeObj) + "px" +
			"</div>" +
			"<div class='moreInfoLink'><a href='#'>More...</a></div>" +
			"<div class='moreInfoSection'><div class='mediaType'><div class='label'><em>Media Type:</em></div> " +
				photo.imageInfoObj.media +
			"</div>" +
			"<div class='safeSearch'><div class='label'><em>Safe Search:</em></div> " +
				photo.result.search.safeSearchLevel +
			"</div>" +
			"<div class='minDate'>" + "<div class='label'><em>Min Date:</em></div> " +
				minDateString +
			"</div>" +
			"<div class='maxDate'>" + "<div class='label'><em>Max Date:</em></div> " +
				maxDateString +
			"</div>" +
			textTagString +
			origDateString +
			colorString +
			styleString +
		"</div></div>");
	imageTooltip.clone().appendTo(appendedImage);
	appendedImage.hide().fadeIn('slow');
	$('#images').prepend(appendedImage).imagesLoaded(function()
	{
		grid.masonry( 'prepended', appendedImage ).masonry('layout');
	});
	appendedImage.tooltip({
		content: imageTooltip,
		items: appendedImage,
		track: true
	});
	if(window.innerWidth < 600)
	{
		appendedImage.tooltip("disable");
	}
}

/* End Output */

/* onClick Setup */
$(function()
{
	/* Expand/Collapse */
	$('.sectionLabel').click(function()
	{
		if($(this).hasClass('expanded'))
		{
			$(this).parent().find('.sectionContent').hide();
			$(this).removeClass('expanded');
			$(this).attr("aria-expanded", "false");
		}
		else
		{
			$('.sectionLabel.expanded').attr("aria-expanded", "false").removeClass('expanded').parent().find('.sectionContent').hide();
			$(this).addClass("expanded").attr("aria-expanded", "true");
			$(this).parent().find('.sectionContent').show();
			
		}
	});
	$(document).click(function(event) {
		if($(event.target).closest('.configSection').length == 0) {
			$('.sectionLabel.expanded').each(function()
			{
				$(this).parent().find('.sectionContent').hide();
				$(this).removeClass('expanded');
				$(this).attr("aria-expanded", "false");
			});
		}        
	});


	$('#moreFiltersLabel').click(function()
	{
		if(!$(this).hasClass("expanded"))
		{
			$('#moreFiltersContent').show();
			updateHeaderPadding();
			$(this).addClass('expanded').attr("aria-expanded", "true");
			$('.sectionLabel.expanded').attr("aria-expanded", "false").removeClass('expanded').parent().find('.sectionContent').hide();
		}
		else
		{
			$('#moreFiltersContent').hide();
			updateHeaderPadding();
			$(this).removeClass('expanded').attr("aria-expanded", "false");
		}
	});
	/* End Expand/Collapse */

	/* Main Buttons */
	$('#getImages').click(function()
	{
		mainSearch(null);
	});
	/* Form submission from pressing enter in text search box */
	$('#textTagBox').keydown(function(event)
	{
		if(event.key == 'Enter' && currentSearch == null)
		{
			mainSearch(null);
			$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
		}
	});
	$('#cancelSearch').click(function()
	{
		cancelSearch();
	})
	$('#downloadImages').click(function()
	{
		downloadImages();
	});
	$('#clearImages').click(function()
	{
		$('.singleImageHolder').remove();
		$('#images').css('height', 'auto');
		$('#messageHolder').html('');
		displayedImages.length = 0;
	});
	/* End Main Buttons */

	/* Filters */
		/* How Many */
		$('#numImagesBox').click(function()
		{
			$('#num10, #num25').prop("checked", false);
			$('#numX').prop("checked", true);
			updateActiveRadioChecks();
		});
		$('#numImagesBox').on("change keyup", function()
		{
			imageNumbersText();
		});
		$('#imageNumbersChooser input').click(function()
		{
			imageNumbersText();
			if($('#imageNumbersChooser input:checked').val() != "X")
			{
				$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
			}
		});

		/* Date Chooser */
		$('#chooseDate').click(function()
		{
			dateText();
			$('#dateChooser').show();
		});
		$('#randomDate').click(function()
		{
			dateText();
			$('#dateChooser').hide();
			$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
		});
		$('#startDateTimeBox, #endDateTimeBox').on("update dp.change", function()
		{
			dateText();
		});

		/* Minimum Size */
		$('#minSizeChooser input[type=radio]').click(function()
		{
			sizeText();
			if($('#minSizeChooser input[type=radio][name="minSize"]:checked').val() != "custom")
			{
				$('#customSizeSection').hide();
				$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
			}
			else
			{
				$('#customSizeSection').show();
			}
		});
		$('#sizeWidthBox, #sizeHeightBox').on("change keyup", function()
		{
			sizeText();
		});

		/* License */
		$('#licenseChooser').on("click", "input", function()
		{
			licenseText();
		});

		/* Thumbnails */
		$('#largeDisplaySize').click(function()
		{
			$("#imageDisplaySize").attr("href", "css/2col.css");
			if(enableCookies)
			{
				setRadioCookie("imageSize");
			}
			imageSizeText();
			$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
			setTimeout(function()
			{
				grid.masonry('layout');
			}, 100);
		});
		$('#mediumDisplaySize').click(function()
		{
			$("#imageDisplaySize").attr("href", "css/3col.css");
			setRadioCookie("imageSize");
			if(enableCookies)
			{
				imageSizeText();
			}
			$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
			setTimeout(function()
			{
				grid.masonry('layout');
			}, 100);
		});
		$('#smallDisplaySize').click(function()
		{
			$("#imageDisplaySize").attr("href", "css/4col.css");
			if(enableCookies)
			{
				setRadioCookie("imageSize");
			}
			imageSizeText();
			$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
			setTimeout(function()
			{
				grid.masonry('layout');
			}, 100);
		});

		/* Safe Search */
		$('#safeSearchChooser input').click(function()
		{
			safeText();
			$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
		});

		/* User Id */
		$('#useridBox').on("change keyup", function()
		{
			useridText();
		});
		$('#clearUseridBox').click(function()
		{
			$('#useridBox').val('');
			useridText();
		});
	
		/* Colors */
		$('.colorLink').click(function()
		{
			toggleColorLink(this);
			selectedColors.length = 0;
			$('.colorLink.checked').each(function() {
				selectedColors.push($(this).attr("data"));
			});
			colorText();
		});
		$('#clearColors').click(function()
		{
			selectedColors.length = 0;
			$('.colorLink.checked').addClass("unchecked").removeClass("checked");
			colorText();
			return false;
		});

		/* Styles */
		$('#styleChooser input').click(function()
		{
			styleText();
		});
	
		/* Orientations */
		$('#orientationChooser input').click(function()
		{
			orientationText();
		});

		/* Media Type */
		$('#mediaTypeChooser input').click(function()
		{
			mediaTypeText();
			$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
		});

		/* Choose Method */
		$('#selectionTypeChooser input').click(function()
		{
			selectionTypeText();
			$(this).closest('.sectionContent').hide().parent().find('.sectionLabel').removeClass('expanded').attr("aria-expanded", "false");
		});
	
		/* Text Tag */
		$('#textTagBox').on("change keyup", function()
		{
			textTagText();
		});
		$('#randomTextTag').click(function()
		{
			$.get("nounlist/nounlist.txt", function(txt)
			{
				var lines = txt.split("\n");
				var randLineNum = Math.floor(Math.random() * lines.length);
				$('#textTagBox').val(lines[randLineNum]);
			}).then(function () {textTagText()});
			return false;
		});
		$('#clearTextTagBox').click(function()
		{
			$('#textTagBox').val('');
			textTagText();
			return false;
		});
	
	/* End Filters */

	/* Checkbox and radio parent active */
	$(document).on('change', '.form-check-input', function()
	{
		updateActiveRadioChecks();
	});

	$(document).on('click', '.moreInfoLink a', function()
	{
		$(this).parent().parent().find('.moreInfoSection').toggle();
		$(this).parent().hide();
		return false;
	});
	/* End checkbox and radio parent active */

	$('#enableCookiesLabel').click(function()
	{
		if($('#enableCookiesCheck').is(":checked"))
		{
			enableCookies = true;
			setEnableCookies();
		}
		else
		{
			enableCookies = false;
			removeAllCookies();
		}
	});
});
/* End onClick Setup */

/* Display */
function updateAllText()
{
	licenseText();
	safeText();
	dateText();
	textTagText();
	useridText();
	colorText();
	styleText();
	orientationText();
	sizeText();
	mediaTypeText();
	imageSizeText();
	selectionTypeText();
	imageNumbersText();
}

function licenseText()
{
	if($('#licenseChooser input[type="checkbox"]').not(':checked').length == 0)
	{
		$('#licenseChooser .labelText').html("Licenses: All");
	}
	else
	{
		var selNum = $('#licenseChooser input[type="checkbox"]:checked').length;
		$('#licenseChooser .labelText').html("Licenses: " + selNum + " Selected");
	}
}

function safeText()
{
	var ss = $('input:radio[name="safeSearch"]:checked').val();
	ss = capitalizeFirstLetter(ss);
	$('#safeSearchChooser .labelText').html('Safe Search: ' + ss);
}

function dateText()
{
	var dt = $('input:radio[name="dateType"]:checked').val();
	if(dt == "random")
	{
		$('#dateTypeChooser .labelText').html("Dates: Random");
	}
	if(dt == "choose")
	{
		var minDateString = $('#startDateTimeBox').val().toString();
		var maxDateString = $('#endDateTimeBox').val().toString();
		if(minDateString.trim() == '' && maxDateString.trim() == '')
		{
			$('#dateTypeChooser .labelText').html("Dates: None chosen");
		}
		else if(minDateString.trim() == '')
		{
			$('#dateTypeChooser .labelText').html("Dates: <div class='dateLabelSmall'>Before " + maxDateString.trim() + "</div>");
		}
		else if(maxDateString.trim() == '')
		{
			$('#dateTypeChooser .labelText').html("Dates: <div class='dateLabelSmall'>After " + minDateString.trim() + "</div>");
		}
		else
		{
			$('#dateTypeChooser .labelText').html("<div class='dateLabelLarge'>Dates:</div> <div class='dateLabelSmall twoLine'>" + minDateString.trim() + " to<br>" + maxDateString.trim() + "</div>");
		}
	}
}

function textTagText()
{
	var tt = $('#textTagBox').val();
	if(tt.trim() == '')
	{
		$('#textTagChooser .labelText').html('Text: None');
	}
	else
	{
		$('#textTagChooser .labelText').html('Text: ' + tt.trim());
	}
}

function useridText()
{
	var ui = $('#useridBox').val();
	if(ui.trim() == '')
	{
		$('#useridChooser .labelText').html('User: Any');
	}
	else
	{
		$('#useridChooser .labelText').html('User: ' + ui);
	}
}

function colorText()
{
	if($('.colorLink.checked').length > 0)
	{
		var cs = $('.colorLink.checked').length;
		$('#colorChooser .labelText').html('Colors: ' + cs + ' Selected');
	}
	else
	{
		$('#colorChooser .labelText').html('Colors: Any');
	}
}

function styleText()
{
	if($('#styleChooser input[type="checkbox"]:checked').length > 0)
	{
		var ss = $('#styleChooser input[type="checkbox"]:checked').length;
		$('#styleChooser .labelText').html('Styles: ' + ss + ' Selected');
	}
	else
	{
		$('#styleChooser .labelText').html('Styles: Any');
	}
}

function orientationText()
{
	if($('#orientationChooser input[type="checkbox"]').not(':checked').length > 0)
	{
		var os = $('#orientationChooser input[type="checkbox"]:checked').length;
		$('#orientationChooser .labelText').html('Orientations: ' + os + ' Selected');
	}
	else
	{
		$('#orientationChooser .labelText').html('Orientations: All');
	}
}

function sizeText()
{
	var cs = $("#minSizeChooser input[type='radio'][name='minSize']:checked").val();
	if(cs == "custom")
	{
		var mw = $('#sizeWidthBox').val();
		var mh = $('#sizeHeightBox').val();
		if((mw.trim() == '' || mw == '0') && (mh.trim() == '' || mh == '0'))
		{
			$('#minSizeChooser .labelText').html('Minimum Size: None');
		}
		else if(mw.trim() == '' || mw == '0')
		{
			$('#minSizeChooser .labelText').html('Minimum Height: ' + mh + "px");
		}
		else if(mh.trim() == '' || mh == '0')
		{
			$('#minSizeChooser .labelText').html('Minimum Width: ' + mw + "px");
		}
		else
		{
			$('#minSizeChooser .labelText').html('Minimum Size: ' + mw + "px x " + mh + "px");
		}
	}
	else
	{
		cs = capitalizeFirstLetter(cs);
		$('#minSizeChooser .labelText').html('Minimum Size: ' + cs);
	}
}

function mediaTypeText()
{
	var mt = $('input[type="radio"][name="mediaType"]:checked').val();
	if(mt == "all")
	{
		$('#mediaTypeChooser .labelText').html('Media: All Types');
	}
	if(mt == "photos")
	{
		$('#mediaTypeChooser .labelText').html('Media: Photos');
	}
	if(mt == "videos")
	{
		$('#mediaTypeChooser .labelText').html('Media: Videos');
	}
}

function imageSizeText()
{
	var ts = $('input[type="radio"][name="imageSize"]:checked').val();
	$('#imageSizeChooser .labelText').html("Thumbnails: " + capitalizeFirstLetter(ts));
}

function selectionTypeText()
{
	var st = $('input[type="radio"][name="selectionType"]:checked').val();
	if(st == "random")
	{
		$("#selectionTypeChooser .labelText").html("Choose: Randomly");
	}
	else
	{
		$("#selectionTypeChooser .labelText").html("Choose: First Available");
	}
}

function imageNumbersText()
{
	var ni = $('input[type="radio"][name="numImages"]:checked').val();
	if(ni == "X")
	{
		var nibox = $('#numImagesBox').val();
		if(nibox.trim() != '')
		{
			$('#imageNumbersChooser .labelText').html('How Many: ' + nibox);
		}
		else
		{
			$('#imageNumbersChooser .labelText').html('How Many: ?');
		}
	}
	else
	{
		$('#imageNumbersChooser .labelText').html('How Many: ' + ni);
	}
}

function updateActiveRadioChecks()
{
	$("input[type=radio], input[type=checkbox]").each(function()
	{
		if(this.checked)
		{
			$(this).parent().addClass("active");
		}
		else
		{
			$(this).parent().removeClass("active");
		}
	});
}

function updateProgressBar(current, total)
{
	var percent = Math.floor((current / total) * 100);
	$('#imagesReturned .progress-bar').css('width', percent + "%").html(current + "/" + total + " images");
}

function updateHeaderPadding()
{
	if(window.innerWidth >= 600)
	{
		var height = document.getElementById("header").offsetHeight;
		document.getElementById("imageHolder").style.paddingTop = height + 'px';
	}
	else
	{
		document.getElementById("imageHolder").style.paddingTop = '0px';
	}
}

function enableButtonHideBar()
{
	$('#getImages').removeClass('disabled');
	$('#cancelSearch').addClass('disabled');
	$('#imagesReturned').fadeOut(function()
	{
		updateHeaderPadding();
	});
}

/* End Display */