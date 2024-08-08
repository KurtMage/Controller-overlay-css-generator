var originalState = new Map();
var baseLayoutUrl2OriginalState = new Map();
var pastStates = [];
var undoneStates = [];
var selectedButton;
var lastMovedButton;
var drag = false;
var urlImageIsGood = false;
var lastKeyPressMove;
var baseLayoutUrl = "https://gamepadviewer.com/?p=1&s=7&map=%7B%7D&editcss=https://kurtmage.github.io/hitbox%20layout/console%20controllers/xbox/xbox.css";
var hiddenPressedImgUpdater;
var hiddenUnpressedImgUpdater;
var importButtonInterval;
var mostRecentlyChangedTextBox;

const stateMapUrlKey = "baseLayoutUrl";

function init() {
	document.onmousedown = clickAction;
	document.onmouseup = stopDrag;
	document.onkeydown = arrowKeyMove;

	hiddenUnpressedImgUpdater = new Image();
	hiddenUnpressedImgUpdater.onload = function() {
		checkImage(true, this, document.getElementById("unpressedButtonUrlInput"),
					document.getElementById("unpressedButtonMakerCloseErrorButton"));

	};
	hiddenUnpressedImgUpdater.onerror = function() {
		checkImage(false, this, document.getElementById('unpressedButtonUrlInput'),
					document.getElementById('unpressedButtonMakerCloseErrorButton'));
	};
	hiddenPressedImgUpdater = new Image();
	hiddenPressedImgUpdater.onload = function() {
		checkImage(true, this, document.getElementById("pressedButtonUrlInput"),
					document.getElementById("pressedButtonMakerCloseErrorButton"));

	};
	hiddenPressedImgUpdater.onerror = function() {
		checkImage(false, this, document.getElementById('pressedButtonUrlInput'),
					document.getElementById('pressedButtonMakerCloseErrorButton'));
	};


	switchBaseLayout(baseLayoutUrl, false, false, false);
	originalState = pastStates[0];
	// for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
	// 	const state = getStateOfImg(img);
	// 	originalState.set(img.id, state);
	// }
	// pastStates.push(originalState);
	
}

function switchBaseLayout(linkToGamepadviewerBaseLayout,
						noopIfCurrentLayout = true,
						async = true,
						writeCss = true) {
	// No switch.
	if (noopIfCurrentLayout && baseLayoutUrl === linkToGamepadviewerBaseLayout) {
		return;
	}

	var request = new XMLHttpRequest();

	request.addEventListener("load", function(evt){
		const parser = new DOMParser();
		const doc = parser.parseFromString(this.responseText, "text/html");
		doc.getElementById("body");

		var parseCssRules = function (cssText) {
			var tokenizer = /\s*([a-z\-]+)\s*:\s*((?:[^;]*url\(.*?\)[^;]*|[^;]*)*)\s*(?:;|$)/gi,
			obj = {},
			token;
			while ( (token=tokenizer.exec(cssText)) ) {
			obj[token[1].toLowerCase()] = token[2];
			}
		return obj;
		};
		const cssRules = parseCssRules(doc.body.textContent)
		console.log(cssRules);

		const layoutBox = document.getElementById("layout-box");
		for (const img of layoutBox.getElementsByTagName('*')) {
			if (img.id === ".fight-stick .fstick") {
				continue;
			}
			resetButtonAndPressedVersion(img);
			// img.style.width = originalState.get(img.id).size;
			// img.style.height = originalState.get(img.id).size;
			img.style.backgroundSize = "cover";
		}

		document.getElementById(".fight-stick .x").style.backgroundImage = cssRules["--top-row-index-finger-button-source-image"];
		document.getElementById(".fight-stick .y").style.backgroundImage = cssRules["--top-row-middle-finger-button-source-image"];
		document.getElementById(".fight-stick .a").style.backgroundImage = cssRules["--bot-row-index-finger-button-source-image"];
		document.getElementById(".fight-stick .b").style.backgroundImage = cssRules["--bot-row-middle-finger-button-source-image"];
		document.getElementById(".fight-stick .bumper.right").style.backgroundImage = cssRules["--top-row-ring-finger-button-source-image"];
		document.getElementById(".fight-stick .bumper.left").style.backgroundImage = cssRules["--top-row-pinky-finger-button-source-image"];
		document.getElementById(".fight-stick .trigger-button.right").style.backgroundImage = cssRules["--bot-row-ring-finger-button-source-image"];
		document.getElementById(".fight-stick .trigger-button.left").style.backgroundImage = cssRules["--bot-row-pinky-finger-button-source-image"];

		document.getElementById(".fight-stick .face.left").style.backgroundImage = cssRules["--left-arrow-source-image"];
		document.getElementById(".fight-stick .face.down").style.backgroundImage = cssRules["--down-arrow-source-image"];
		document.getElementById(".fight-stick .face.right").style.backgroundImage = cssRules["--right-arrow-source-image"];
		document.getElementById(".fight-stick .face.up").style.backgroundImage = cssRules["--up-arrow-source-image"];

		document.getElementById(".fight-stick .start").style.backgroundImage = cssRules["--start-button-source-image"];
		document.getElementById(".fight-stick .back").style.backgroundImage = cssRules["--back-button-source-image"];

		document.getElementById(".fight-stick .stick.left").style.backgroundImage = cssRules["--ls-button-source-image"];
		document.getElementById(".fight-stick .stick.right").style.backgroundImage = cssRules["--rs-button-source-image"];


		// This is here as a start, in case I want there to be less Css for people to copy.
		// I think I prefer that you can just paste the Css from any URL, though.
		// if (!baseLayoutUrl2OriginalState.has(linkToGamepadviewerBaseLayout)) {
		// 	originalStateForThisLayout = new Map();
		// 	for (const button of layoutBox.getElementsByTagName('*')) {
		// 		backgroundImageForThisButtonOnThisBaseLayout = document.getElementById(button.id).style.backgroundImage;
		// 		const state = getStateOfImgWithSpecifiedBackgroundImg(button, backgroundImageForThisButtonOnThisBaseLayout);
		// 		id2state.set(button.id, state);
		// 	}
		// }
	

		id2state = new Map();
		var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
		for (const img of layoutBox.getElementsByTagName('*')) {
			if (!img.id.endsWith(".pressed") && img.id !== (".fight-stick .fstick")) {
				document.getElementById(img.id + ".pressed").style.backgroundImage = img.style.backgroundImage;
			}
			if (writeCss && doesButtonHaveChange(img)) {
				changedVariables += getChangedVariables(img);
			}
			const state = getStateOfImg(img);
			id2state.set(img.id, state);
		}
		addToPastStates(id2state);
		document.getElementById("css-text").innerHTML = changedVariables;

		// document.getElementById("baseLayoutPreview").innerHTML = layoutBox.innerHTML;
	}, false);

	baseLayoutUrl = linkToGamepadviewerBaseLayout;
	const baseLayoutEditCss = linkToGamepadviewerBaseLayout.split("&editcss=")[1];

	request.open('GET', baseLayoutEditCss, async),
	request.send();
}


function arrowKeyMove(e) {
	if (document.getElementById("moveTab").style.display !== 'block') {
		// Not on move tab.
		return;
	}
	function applyMoveButtonValues(btn, amount, moveVertically) {
		const computedStyle = getComputedStyle(btn);
		if (moveVertically) {
			btn.style.top = (parseInt(computedStyle.top) - amount) + "px";
		} else {
			btn.style.left = (parseInt(computedStyle.left) - amount) + "px";
		}
	}
	function moveButton(e, button, moveAmount) {
		switch (e.key) {
			case "ArrowLeft":
				e.preventDefault();
				applyMoveButtonValues(button, moveAmount, false);
				break;
			case "ArrowDown":
				e.preventDefault();
				applyMoveButtonValues(button, -moveAmount, true);
				break;
			case "ArrowRight":
				e.preventDefault();
				applyMoveButtonValues(button, -moveAmount, false);
				break;
			case "ArrowUp":
				e.preventDefault();
				applyMoveButtonValues(button, moveAmount, true);
				break;
			default:
				return;
		}
	}

	const moveAmount = parseInt(document.getElementById("moveAmountBox").value);
	if (e.ctrlKey) {
		var elementsToMove = [];
		switch (document.getElementById("moveSelectType").value) {
			case "allElements":
				elementsToMove = document.getElementById("layout-box").getElementsByTagName('*');
				break;
			case "faceButtons":
				elementsToMove = [
					document.getElementById(".fight-stick .x"), 
					document.getElementById(".fight-stick .y"), 
					document.getElementById(".fight-stick .a"), 
					document.getElementById(".fight-stick .b"), 
					document.getElementById(".fight-stick .bumper.right"), 
					document.getElementById(".fight-stick .bumper.left"), 
					document.getElementById(".fight-stick .trigger-button.right"), 
					document.getElementById(".fight-stick .trigger-button.left"), 
				];
				break;
			case "startAndBack":
				elementsToMove = [
					document.getElementById(".fight-stick .start"), 
					document.getElementById(".fight-stick .back"), 
				];
				break;
			case "lsRs":
				elementsToMove = [
					document.getElementById(".fight-stick .stick.right"), 
					document.getElementById(".fight-stick .stick.left"), 
				];
				break;
			default:
				break;
		}
		for (const button of elementsToMove) {
			moveButton(e, button, moveAmount);
		}
	} else {
		if (!lastMovedButton || !["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(e.key)) {
			return;
		}
		e.preventDefault();
		moveButton(e, lastMovedButton, moveAmount);
	}

	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
		const state = getStateOfImg(img);
		id2state.set(img.id, state);
	}
	document.getElementById("css-text").innerHTML = changedVariables;
	// Removing state from 1-pixel away in order to group arrow-key moves.
	if (e.key === lastKeyPressMove) {
		pastStates.pop();
	}
	addToPastStates(id2state);
	lastKeyPressMove = e.key;
}

function displayStickExample() {
	img = document.getElementById("stickExampleImage");
	img.hidden = false;
	document.getElementById("stickToolTip").style.top = img.height + " px";
}

function hideStickExample() {
	document.getElementById("stickExampleImage").hidden = true;
}

function alternatePreviewPicture() {
	const img = document.getElementById("urlButtonPreview");
	// Note: commented code is here in case I want to allow two images
	// for unpressed and pressed buttons.

	// pressedUrl = document.getElementById("pressedImportedUrlInput").value;
	pressedUrl = "";
	if (pressedUrl === "") {
		const pressButton = img.style.objectPosition === "0% 0%";
		img.style.objectPosition = `0% ${pressButton ? '100%' : '0%'}`;
	} else {
		// img.style.objectPosition = '0% 0%';
		// unpressedUrl = document.getElementById("unpressedImportedUrlInput").value;
		// if (img.src === pressedUrl || img.src === pressedUrl + ".png") {
		// 	const formattedUnpressedUrl = validImageUrlStyle(unpressedUrl) ? `${unpressedUrl}` : `${unpressedUrl}.png`;
		// 	img.src = formattedUnpressedUrl;
		// } else {
		// 	const formattedPressedUrl = validImageUrlStyle(pressedUrl) ? `${pressedUrl}` : `${pressedUrl}.png`
		// 	img.src = formattedPressedUrl;
		// }
	}
}

function rotateStickPreviewPicture() {
	const img = document.getElementById("stickPreview");

	const curPosition = parseFloat(img.style.objectPosition);
	const newPos = (curPosition + 12.5 > 100)  ? 0 : curPosition + 12.5;
	img.style.objectPosition = newPos + "% 0%";
}

function updatePreviewPicture(url, previewPicture) {
	clearInterval(importButtonInterval);
	const img = previewPicture;
	img.src = validImageUrlStyle(url) ? url : `${url}.png`;
	img.style.objectPosition = "0% 0%";
	if (previewPicture.id === "urlButtonPreview") {
		importButtonInterval = setInterval(alternatePreviewPicture, 1000);
	} else if (previewPicture.id === "stickPreview") {
		importButtonInterval = setInterval(rotateStickPreviewPicture, 300);
	}
}

function checkImage(success, 
					img = document.getElementById("urlButtonPreview"),
					urlInputBox = document.getElementById("importedUrlInput"),
					closeErrorButton = document.getElementById("closeErrorButton"),
					previewText = document.getElementById("previewText")) {
	if (success || urlInputBox.value === '') {
		img.visibility = urlInputBox.value === '' ? "hidden" : "visible";
		const imgSize =  img.id === "stickPreview" ? "250px" : "150px"
		img.style.width = urlInputBox.value === '' ? "0px" : imgSize;
		img.style.height = urlInputBox.value === '' ? "0px" : imgSize;
		urlInputBox.style.background = "#ffffff";
		urlInputBox.style.borderColor = "#000000";
		previewText.style.display = urlInputBox.value === '' ? "none" : "block";
		// Clicking the error button makes it go away.
		closeErrorButton.click();
		urlImageIsGood = true;
	} else {
		img.visibility = "hidden";
		img.style.width = "0px";
		img.style.height = "0px";
		urlInputBox.style.background = "#fff0f4";
		urlInputBox.style.borderColor = "#c51244";
		closeErrorButton.parentElement.style.display = "block";
		previewText.style.display = "none";
		urlImageIsGood = false;
	}
}

function clickAction(e) {
	document.getElementById("clickToCopy").innerText = "Click to copy";
	if (document.getElementById("moveTab").style.display === 'block') {
		startDrag(e);
	} else if (document.getElementById("deleteTab").style.display === 'block') {
		deleteButton(e);
	} else if (document.getElementById("importButtonsTab").style.display === 'block') {
		importButton(e);
	} else if (document.getElementById("changeSizeTab").style.display === 'block') {
		resizeButton(e);
	} else if (document.getElementById("makeButtonsTab").style.display === 'block') {
		applyMadeButton(e);
	} else if (document.getElementById("importStickTab").style.display === 'block') {
		importStick(e);
	}
}

function importStick(e) {
	const url = document.getElementById("stickImportedUrlInput").value;
	targ = e.target ;
	if (!targ.className?.startsWith("img ")
		|| targ.tagName?.toUpperCase() != "SPAN"
		|| !urlImageIsGood) {
		return;
	}

	if (!targ) { return; }
	const fstick = document.getElementById(".fight-stick .fstick");
	if (!fstick.hidden) {
		// TODO error;
		return;
	}

	const urlCss = validImageUrlStyle(url) ? `url(\"${url}\")` : `url(\"${url}.png\")`;
	if (targ.style.backgroundImage === urlCss) {
		return;
	}

	lastKeyPressMove = null;

	const targStyle = getComputedStyle(targ);

	// Move fstick to location and size of button it replaced.
	fstick.style.top = targStyle.top;
	fstick.style.left = targStyle.left;
	fstick.style.width = targStyle.width;
	fstick.style.height = targStyle.height;
	fstick.style.backgroundImage = validImageUrlStyle(url) ? `url("${url}")` : `url("${url}.png")`;
	fstick.style.visibility = "visible";
	fstick.hidden = false;
	fstick.style.display = "block";

	// Fstick replaces the button, so delete it.
	deleteButton(e);

	// We do not need to capture state, because deleteButton() does it for us.
}

function applyMadeButton(e) {
	targ = e.target ;
	// TODO give error if they try to do this on a stick
	if (!targ.className?.startsWith("img ")
		|| targ.tagName?.toUpperCase() != "SPAN"
		|| targ.id === ".fight-stick .fstick") {
		return;
	}

	lastKeyPressMove = null;

	// Reset anything that import may have done.
	resetButtonAndPressedVersion(targ);

	const unpressedStyle = getComputedStyle(document.getElementById("unpressedMadeButton"));
	const pressedStyle = getComputedStyle(document.getElementById("pressedMadeButton"));

	targ.style.background = "none";
	targ.style.backgroundColor = unpressedStyle.backgroundColor;
	targ.style.height = unpressedStyle.height;
	targ.style.width = unpressedStyle.width;
	targ.style.borderRadius = unpressedStyle.borderRadius;
	targ.style.border = unpressedStyle.border;
	targ.style.backgroundImage = unpressedStyle.backgroundImage;
	targ.style.backgroundSize = unpressedStyle.backgroundSize;
	targ.style.backgroundRepeat = unpressedStyle.backgroundRepeat;
	targ.style.backgroundPosition = unpressedStyle.backgroundPosition;

	const pressedImg = document.getElementById(targ.id + ".pressed");

	pressedImg.style.background = "none";
	pressedImg.style.backgroundColor = pressedStyle.backgroundColor;
	pressedImg.style.height = pressedStyle.height;
	pressedImg.style.width = pressedStyle.width;
	pressedImg.style.borderRadius = pressedStyle.borderRadius;
	pressedImg.style.border = pressedStyle.border;
	pressedImg.style.backgroundImage = pressedStyle.backgroundImage;
	pressedImg.style.backgroundSize = pressedStyle.backgroundSize;
	pressedImg.style.backgroundRepeat = pressedStyle.backgroundRepeat;
	pressedImg.style.backgroundPosition = pressedStyle.backgroundPosition;


	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
		const state = getStateOfImg(img);
		id2state.set(img.id, state);
	}
	addToPastStates(id2state);
	document.getElementById("css-text").innerHTML = changedVariables;
}

function resizeButton(e) {
	targ = e.target ;
	if (!targ.className?.startsWith("img ") || targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}

	console.log('resize');

	style = getComputedStyle(targ);
	const size = parseInt(document.getElementById("sizeInput").value);
	if (isNaN(size) || style.width === size) { return; }

	lastKeyPressMove = null;

	// targ.style.backgroundSize = `${size}px`;
	targ.style.height = `${size}px`;
	targ.style.width = `${size}px`;

	// There's no pressed version of stick.
	if (targ.id !==  ".fight-stick .fstick") {
		const pressedImg = document.getElementById(targ.id + ".pressed");

		// pressedImg.style.backgroundSize = `${size}px`;
		pressedImg.style.height = `${size}px`;
		pressedImg.style.width = `${size}px`;
		// pressedImg.style.backgroundPositionY = `-${size}px`;
	}

	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
		const state = getStateOfImg(img);
		id2state.set(img.id, state);
	}
	addToPastStates(id2state);
	document.getElementById("css-text").innerHTML = changedVariables;
}

function importButton(e) {
	const urlBox = document.getElementById("importedUrlInput");
	const url = urlBox.value;
	targ = e.target ;
	if (!targ.className?.startsWith("img ")
		|| targ.tagName?.toUpperCase() != "SPAN"
		|| targ.id === ".fight-stick .fstick"
		|| !urlImageIsGood
		|| !targ) {
		return;
	}

	if (e.button === 2) {
		// e.preventDefault();
		const newUri = targ.style.backgroundImage.slice(4, -1).replace(/"/g, "").replace('"', '');
		const newEncodedUri = newUri === decodeURI(newUri) ? encodeURI(newUri) : newUri ;
		urlBox.value = newEncodedUri;
		updatePreviewPicture(urlBox.value, document.getElementById("urlButtonPreview"));
		return;
	}

	const urlCss = validImageUrlStyle(url) ? `url(\"${url}\")` : `url(\"${url}.png\")`;
	if (targ.style.backgroundImage === urlCss) {
		return;
	}

	lastKeyPressMove = null;

	// Reset anything that make button may have done.
	resetButtonAndPressedVersion(targ);

	// targ.style.backgroundImage = `url(https://imgur.com/hNxfRJI.png)`;
	targ.style.backgroundImage = validImageUrlStyle(url) ? `url("${url}")` : `url("${url}.png")`;
	const imgSize = targ.offsetWidth;
	// targ.style.backgroundSize = `${imgSize}px`;
	targ.style.width = `${imgSize}px`;
	targ.style.height = `${imgSize}px`;

	const pressedImg = document.getElementById(targ.id + ".pressed");
	pressedImg.style.backgroundImage = validImageUrlStyle(url) ? `url("${url}")` : `url("${url}.png")`;
	// pressedImg.style.backgroundSize = `${imgSize}px`;
	pressedImg.style.width = `${imgSize}px`;
	pressedImg.style.height = `${imgSize}px`;
	pressedImg.style.backgroundPositionY = `100%`;

	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
		const state = getStateOfImg(img);
		id2state.set(img.id, state);
	}
	addToPastStates(id2state);
	document.getElementById("css-text").innerHTML = changedVariables;
}

function deleteButton(e) {
	// determine event object
	if (!e) {
		var e = window.event;
	}

	targ = e.target ;
	if (!targ.className?.startsWith("img ") || targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}
	// assign default values for top and left properties
	const img = document.getElementById(targ.id);
	if (!img) { return; }

	lastKeyPressMove = null;

	img.style.zIndex = -1;

	targ.style.visibility = "hidden";

	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
		const state = getStateOfImg(img);
		id2state.set(img.id, state);
	}
	addToPastStates(id2state);
	document.getElementById("css-text").innerHTML = changedVariables;
}

function startDrag(e) {

	lastKeyPressMove = null;
	// determine event object
	if (!e) {
		var e = window.event;
	}

	targ = e.target ;
	if (!targ.className?.startsWith("img ") || targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}
	if(e.preventDefault) e.preventDefault();

	// calculate event X, Y coordinates
	offsetX = e.clientX;
	offsetY = e.clientY;

	// assign default values for top and left properties
	selectedButton = targ;
	lastMovedButton = targ;
	targ.style.zIndex = 1;
	if (!targ.style.left) { targ.style.left=targ.offsetLeft + 'px'};
	if (!targ.style.top) { targ.style.top=targ.offsetTop + 'px'};

	// calculate integer values for top and left 
	// properties
	coordX = parseInt(targ.style.left);
	coordY = parseInt(targ.style.top);
	drag = true;

	// move div element
	document.onmousemove=dragDiv;
	return false;
	
}

function dragDiv(e) {
	if(e.preventDefault) e.preventDefault();
	if (!drag) {return};
	if (!e) { var e= window.event};

	if (!targ.className?.startsWith("img ") || targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}
	// move div element
	targ.style.left=coordX+e.clientX-offsetX+'px';
	targ.style.top=coordY+e.clientY-offsetY+'px';
	return false;
}

function stopDrag() {
	if (!drag) {
		return;
	}
	drag = false;
	if (selectedButton) {
		selectedButton.style.zIndex = 0;
	}
	const isNewState = selectedButton.offsetTop !==
			pastStates[pastStates.length - 1].get(selectedButton.id).top
			|| selectedButton.offsetLeft !==
			pastStates[pastStates.length - 1].get(selectedButton.id).left;
	if (!isNewState) {
		return;
	}

	var hasChanged = false;
	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			hasChanged = true;
			changedVariables += getChangedVariables(img);
		}
		const state = getStateOfImg(img);
		id2state.set(img.id, state);
	}
	if (hasChanged) {
		addToPastStates(id2state);
	}
	
	document.getElementById("css-text").innerHTML = changedVariables;
	selectedButton = null;

	// document.getElementById("css-text3").value =changedVariables;
}

function undo() {
	if (pastStates.length <= 1) {
		return;
	}
	lastKeyPressMove = null;
	currentState = pastStates.pop();
	undoneStates.push(currentState);
	document.getElementById('redoButton').style.color = "#fff";
	stateToReturnTo = pastStates[pastStates.length - 1];
	for (const [id, locationToReturnTo] of stateToReturnTo.entries()) {
		if (id === stateMapUrlKey) {
			continue;
		}
		const currentLocation = currentState.get(id);
		const img = document.getElementById(id);
		if (currentLocation.top !== locationToReturnTo.top) {
			img.style.top = locationToReturnTo.top;
		}
		if (currentLocation.left !== locationToReturnTo.left) {
			img.style.left = locationToReturnTo.left;
		}
		if (locationToReturnTo.top === originalState.get(id).top) {
			img.style.top = null;
		}
		if (locationToReturnTo.left === originalState.get(id).left) {
			img.style.left = null;
		}
		if (locationToReturnTo.visibility !== originalState.visibility) {
			img.style.visibility = locationToReturnTo.visibility;
			img.style.zIndex = 0;
		}
		if (locationToReturnTo.background !== currentLocation.background) {
			img.style.background = locationToReturnTo.background;
		}
		if (locationToReturnTo.size !== currentLocation.size) {
			img.style.backgroundSize = locationToReturnTo.size;
			img.style.width = locationToReturnTo.size;
			img.style.height = locationToReturnTo.size;
		}
		if (locationToReturnTo.border !== currentLocation.border) {
			img.style.border = locationToReturnTo.border;
		}
		if (locationToReturnTo.borderRadius !== currentLocation.borderRadius) {
			img.style.borderRadius = locationToReturnTo.borderRadius;
		}
	}

	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
	}
	document.getElementById("css-text").innerHTML = changedVariables;

	if (pastStates.length <= 1) {
		document.getElementById('undoButton').style.color = "#999";
	}
	console.log(pastStates);
	console.log(undoneStates);
}

function redo() {
	if (undoneStates.length <= 0) {
		return;
	}
	lastKeyPressMove = null;
	currentState = pastStates[pastStates.length - 1];
	stateToReturnTo = undoneStates.pop();
	document.getElementById('undoButton').style.color = "#fff";
	pastStates.push(stateToReturnTo);
	for (const [id, locationToReturnTo] of stateToReturnTo.entries()) {
		if (id === stateMapUrlKey) {
			continue;
		}
		const currentLocation = currentState.get(id);
		const img = document.getElementById(id);
		if (currentLocation.top !== locationToReturnTo.top) {
			img.style.top = locationToReturnTo.top;
		}
		if (currentLocation.left !== locationToReturnTo.left) {
			img.style.left = locationToReturnTo.left;
		}
		if (locationToReturnTo.top === originalState.get(id).top) {
			img.style.top = null;
		}
		if (locationToReturnTo.left === originalState.get(id).left) {
			img.style.left = null;
		}
		if (locationToReturnTo.visibility !== originalState.visibility) {
			img.style.visibility = locationToReturnTo.visibility;
			img.style.zIndex = 0;
		} else {
			img.style.visibility = 'hidden';
			img.style.zIndex = -1;
		}
		if (locationToReturnTo.background !== currentLocation.background) {
			img.style.background = locationToReturnTo.background;
		}
		if (locationToReturnTo.size !== currentLocation.size) {
			img.style.backgroundSize = locationToReturnTo.size;
			img.style.width = locationToReturnTo.size;
			img.style.height = locationToReturnTo.size;
		}
		if (locationToReturnTo.border !== currentLocation.border) {
			img.style.border = locationToReturnTo.border;
		}
		if (locationToReturnTo.borderRadius !== currentLocation.borderRadius) {
			img.style.borderRadius = locationToReturnTo.borderRadius;
		}
	}

	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
	}
	document.getElementById("css-text").innerHTML = changedVariables;

	if (undoneStates.length < 1) {
		document.getElementById('redoButton').style.color = "#999";
	}
	console.log(pastStates);
	console.log(undoneStates);
}

function copyText() {
  // Get the text field
  var copyText = document.getElementById("css-text").innerText;

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText);
}

function copyLayoutBaseURL() {
    navigator.clipboard.writeText(baseLayoutUrl);

    document.getElementById("clickToCopy").innerText = "Copied!";
}

function doesButtonHaveChange(img) {
	const style = getComputedStyle(img);
	const originalStateOfImg = originalState.get(img.id);
    return style.top !== originalStateOfImg.top
		|| style.left !== originalStateOfImg.left
		|| (!img.id.endsWith(".pressed") && style.visibility === 'hidden')
		|| style.background !== originalStateOfImg.background
		|| style.width !== originalStateOfImg.size
		|| style.border !== originalStateOfImg.border
		|| style.borderRadius !== originalStateOfImg.borderRadius
		|| style.backgroundImage !== originalStateOfImg.backgroundImage
		|| style.backgroundSize !== originalStateOfImg.backgroundSize
		|| style.backgroundRepeat !== originalStateOfImg.backgroundRepeat
		|| style.backgroundPosition !== originalStateOfImg.backgroundPosition
		;
}

function addToPastStates(id2state) {
	id2state.set(stateMapUrlKey, baseLayoutUrl);
	pastStates.push(id2state);
	document.getElementById('undoButton').style.color = "#fff";
	undoneStates = [];
	document.getElementById('redoButton').style.color = "#999";
	console.log(pastStates);
	console.log(undoneStates);
}

function getChangedVariables(img) {
	const style = getComputedStyle(img);
	const originalStateOfImg = originalState.get(img.id);
	var changedVariables = '';
	const backgroundChanged = style.background !== originalStateOfImg.background;
	changedVariables +=
	`
	<br>${img.id} {<br>
		${style.top !== originalStateOfImg.top ? `top: ${img.offsetTop}px;<br>` : ''}
		${style.left !== originalStateOfImg.left ? `left: ${img.offsetLeft}px;<br>` : ''}
		${style.visibility !== 'hidden' && backgroundChanged ? `background: ${style.background};<br>` : ''}
		${style.visibility !== originalStateOfImg.visibility ? `visibility: ${style.visibility};<br>` : ''}
		${style.width !== originalStateOfImg.size ? `width: ${style.width};<br>` : ''}
		${style.width !== originalStateOfImg.size ? `height: ${style.width};<br>` : ''}
		${style.border !== originalStateOfImg.border ? `border: ${style.border};<br>` : ''}
		${style.borderRadius !== originalStateOfImg.borderRadius ? `border-radius: ${style.borderRadius};<br>` : ''}
		${style.backgroundPositionY !== originalStateOfImg.backgroundPositionY ? `background-position-y: ${style.backgroundPositionY};<br>` : ''}
		${style.backgroundImage !== originalStateOfImg.backgroundImage ? `background-image: ${style.backgroundImage};<br>` : ''}
		${style.backgroundSize !== originalStateOfImg.backgroundSize ? `background-size: ${style.backgroundSize};<br>` : ''}
		${style.backgroundRepeat !== originalStateOfImg.backgroundRepeate ? `background-repeat: ${style.backgroundRepeat};<br>` : ''}
		${style.backgroundPosition !== originalStateOfImg.backgroundPosition ? `background-image: ${style.backgroundPosition};<br>` : ''}
		${style.borderRadius !== originalStateOfImg.borderRadius ? `border-radius: ${style.borderRadius};<br>` : ''}
		${style.borderColor !== originalStateOfImg.borderColor ? `border-color: ${style.borderColor};<br>` : ''}
	}<br>
	`
	return changedVariables;
}

function getStateOfImgWithSpecifiedBackgroundImg(img, backgroundImage) {
		const originalBackgroundImage = img.backgroundImage;
		img.backgroundImage = backgroundImage;
		const style = getComputedStyle(img);
		// TODO call getstateofimg and change background
		return {
			top: style.top,
			left: style.left,
			visibility: style.visibility,
			background: style.background,
			size: style.width,
			borderRadius: style.borderRadius,
			border: style.border,
			backgroundPositionY: style.backgroundPositionY,
			backgroundImage: style.backgroundImage,
			// backgroundColor: style.backgroundColor,
			backgroundSize: style.backgroundSize,
			backgroundRepeat: style.backgroundRepeat,
			backgroundPosition: style.backgroundPosition,
			borderRadius: style.borderRadius,
			background: style.borderColor,
		};
		img.backgroundImage = originalBackgroundImage;
}

function getStateOfImg(img) {
		const style = getComputedStyle(img);
		return {
			top: style.top,
			left: style.left,
			visibility: style.visibility,
			background: style.background,
			size: style.width,
			borderRadius: style.borderRadius,
			border: style.border,
			backgroundPositionY: style.backgroundPositionY,
			backgroundImage: style.backgroundImage,
			// backgroundColor: style.backgroundColor,
			backgroundSize: style.backgroundSize,
			backgroundRepeat: style.backgroundRepeat,
			backgroundPosition: style.backgroundPosition,
			borderRadius: style.borderRadius,
			borderColor: style.borderColor,
		};
}

function updateMadeButtonColor(colorValue, button) {
	button.style.backgroundColor = colorValue;
}

function updateMadeButtonSize(value, button) {
	button.style.width = value + 'px';
	button.style.height = value + 'px';
}

function updateMadeButtonBorderColor(colorValue, button) {
	button.style.borderColor = colorValue;
}

function updateMadeButtonBorderSize(value, button) {
	button.style.borderWidth = value + 'px';
}

function updateMadeButtonImg(url, button) {
	mostRecentlyChangedTextBox = button;
	button.style.backgroundImage = validImageUrlStyle(url) ? `url("${url}")` : `url("${url}.png")`;
	const fixedUrl = validImageUrlStyle(url) ? url : `${url}.png`;
	if (button.id.startsWith("unpressed")) {
		hiddenUnpressedImgUpdater.src = fixedUrl;
	} else if (button.id.startsWith("pressed")) {
		hiddenPressedImgUpdater.src = fixedUrl;
	}
	button.style.backgroundRepeat = "no-repeat";
	button.style.backgroundPosition = "center";
	// updateMadeButtonImgSize(document.getElementById("unpressedImgSize").value, button);
}

function updateMadeButtonImgSize(size, button) {
	button.style.backgroundSize = size + "px";
}

function initializeMadeButton(madeButton, url, imgSize, buttonColorValue, buttonSize, borderColorValue, borderSize) {
	updateMadeButtonImg(url, madeButton);
	// updateMadeButtonImgSize(imgSize, madeButton);
	updateMadeButtonColor(buttonColorValue, madeButton);
	updateMadeButtonSize(buttonSize, madeButton);
	updateMadeButtonBorderColor(borderColorValue, madeButton);
	updateMadeButtonBorderSize(borderSize, madeButton);
}

function validImageUrlStyle(url) {
	return /.*(png|jpg|svg|gif|webp|jpeg)$/.test(url);
}

function resetButtonAndPressedVersion(button) {
	button.style.background = "";
	button.style.backgroundColor = "";
	button.style.borderRadius = "";
	button.style.border = "";
	button.style.backgroundImage = "";
	button.style.backgroundSize = "";
	button.style.backgroundRepeat = "";
	button.style.backgroundPosition = "";
	button.style.borderColor = "";

	// Probably a redundant check, because Make/Import already can't be applies to pressed.
	if (!button.id.endsWith(".pressed") && button.id !== ".fight-stick .fstick") {
		pressedButton = document.getElementById(button.id + ".pressed");
		pressedButton.style.background = "";
		pressedButton.style.backgroundColor = "";
		pressedButton.style.borderRadius = "";
		pressedButton.style.border = "";
		pressedButton.style.backgroundImage = "";
		pressedButton.style.backgroundSize = "";
		pressedButton.style.backgroundRepeat = "";
		pressedButton.style.backgroundPosition = "";
		pressedButton.style.borderColor = "";
	}
}

function openCity(evt, cityName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
	const tab = document.getElementById(cityName);
    tab.style.display = "block";
    evt.currentTarget.className += " active";

	
	clearInterval(importButtonInterval);
	if (cityName === "importButtonsTab") {
		importButtonInterval = setInterval(alternatePreviewPicture, 1000);
	} else if (cityName === "importStickTab") {
		importButtonInterval = setInterval(rotateStickPreviewPicture, 300);
	}

	var cursorType;
	switch (cityName) {
		case "moveTab":
			cursorType = "move";
		case "tutorialtab":
			cursorType = "auto";
		default:
			"crosshair";
	}
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (img.className.startsWith("img")) {
			img.style.cursor = cursorType;
		}
	}
}

window.onload = function() {
	init();
}
