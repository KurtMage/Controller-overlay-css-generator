var originalState = new Map();
var baseLayoutUrl2OriginalState = new Map();
var pastStates = [];
var undoneStates = [];
var selectedButton;
var moveSelectedButtons = new Set();
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
const stateMapBackgroundUrlKey = "backgroundUrl";

function init() {
	document.onmousedown = clickAction;
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
			obj = new Map(),
			token;
			while ( (token=tokenizer.exec(cssText)) ) {
				var varValue = token[2];
				while (varValue?.startsWith("var(--")) {
					// Expand variable into values.
					varValue = obj.get(varValue.substring(4, varValue.length - 1));
				}
				obj.set(token[1].toLowerCase(), varValue)
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

		// Setting background images.
		document.getElementById(".fight-stick .x").style.backgroundImage = cssRules.get("--top-row-index-finger-button-source-image");
		document.getElementById(".fight-stick .y").style.backgroundImage = cssRules.get("--top-row-middle-finger-button-source-image");
		document.getElementById(".fight-stick .a").style.backgroundImage = cssRules.get("--bot-row-index-finger-button-source-image");
		document.getElementById(".fight-stick .b").style.backgroundImage = cssRules.get("--bot-row-middle-finger-button-source-image");
		document.getElementById(".fight-stick .bumper.right").style.backgroundImage = cssRules.get("--top-row-ring-finger-button-source-image");
		document.getElementById(".fight-stick .bumper.left").style.backgroundImage = cssRules.get("--top-row-pinky-finger-button-source-image");
		document.getElementById(".fight-stick .trigger-button.right").style.backgroundImage = cssRules.get("--bot-row-ring-finger-button-source-image");
		document.getElementById(".fight-stick .trigger-button.left").style.backgroundImage = cssRules.get("--bot-row-pinky-finger-button-source-image");

		document.getElementById(".fight-stick .face.left").style.backgroundImage = cssRules.get("--left-arrow-source-image");
		document.getElementById(".fight-stick .face.down").style.backgroundImage = cssRules.get("--down-arrow-source-image");
		document.getElementById(".fight-stick .face.right").style.backgroundImage = cssRules.get("--right-arrow-source-image");
		document.getElementById(".fight-stick .face.up").style.backgroundImage = cssRules.get("--up-arrow-source-image");

		document.getElementById(".fight-stick .start").style.backgroundImage = cssRules.get("--start-button-source-image");
		document.getElementById(".fight-stick .back").style.backgroundImage = cssRules.get("--back-button-source-image");

		document.getElementById(".fight-stick .stick.left").style.backgroundImage = cssRules.get("--ls-button-source-image");
		document.getElementById(".fight-stick .stick.right").style.backgroundImage = cssRules.get("--rs-button-source-image");

		// Setting top value.
		document.getElementById(".fight-stick .x").style.top = cssRules.get("--x-top")?.startsWith("calc(") ? "" : cssRules.get("--x-top");
		document.getElementById(".fight-stick .y").style.top = cssRules.get("--y-top")?.startsWith("calc(") ? "" : cssRules.get("--y-top");
		document.getElementById(".fight-stick .a").style.top = cssRules.get("--a-top")?.startsWith("calc(") ? "" : cssRules.get("--a-top");
		document.getElementById(".fight-stick .b").style.top = cssRules.get("--b-top")?.startsWith("calc(") ? "" : cssRules.get("--b-top");
		document.getElementById(".fight-stick .bumper.right").style.top = cssRules.get("--rb-top")?.startsWith("calc(") ? "" : cssRules.get("--rb-top");
		document.getElementById(".fight-stick .bumper.left").style.top = cssRules.get("--lb-top")?.startsWith("calc(") ? "" : cssRules.get("--lb-top");
		document.getElementById(".fight-stick .trigger-button.right").style.top = cssRules.get("--rt-top")?.startsWith("calc(") ? "" : cssRules.get("--rt-top");
		document.getElementById(".fight-stick .trigger-button.left").style.top = cssRules.get("--lt-top")?.startsWith("calc(") ? "" : cssRules.get("--lt-top");

		document.getElementById(".fight-stick .face.left").style.top = cssRules.get("--dir-right-top")?.startsWith("calc(") ? "" : cssRules.get("--dir-right-top");
		document.getElementById(".fight-stick .face.down").style.top = cssRules.get("--dir-down-top")?.startsWith("calc(") ? "" : cssRules.get("--dir-down-top");
		document.getElementById(".fight-stick .face.right").style.top = cssRules.get("--dir-right-top")?.startsWith("calc(") ? "" : cssRules.get("--dir-right-top");
		document.getElementById(".fight-stick .face.up").style.top = cssRules.get("--dir-up-top")?.startsWith("calc(") ? "" : cssRules.get("--dir-up-top");

		if (cssRules.has("--ls-top")) {
			document.getElementById(".fight-stick .stick.left").style.top = cssRules.get("--ls-top")?.startsWith("calc(") ? "" : cssRules.get("--ls-top");
		}
		if (cssRules.has("--rs-top")) {
			document.getElementById(".fight-stick .stick.right").style.top = cssRules.get("--rs-top")?.startsWith("calc(") ? "" : cssRules.get("--rs-top");
		}

		// Setting left value.
		document.getElementById(".fight-stick .x").style.left = cssRules.get("--x-left")?.startsWith("calc(") ? "" : cssRules.get("--x-left");
		document.getElementById(".fight-stick .y").style.left = cssRules.get("--y-left")?.startsWith("calc(") ? "" : cssRules.get("--y-left");
		document.getElementById(".fight-stick .a").style.left = cssRules.get("--a-left")?.startsWith("calc(") ? "" : cssRules.get("--a-left");
		document.getElementById(".fight-stick .b").style.left = cssRules.get("--b-left")?.startsWith("calc(") ? "" : cssRules.get("--b-left");
		document.getElementById(".fight-stick .bumper.right").style.left = cssRules.get("--rb-left")?.startsWith("calc(") ? "" : cssRules.get("--rb-left");
		document.getElementById(".fight-stick .bumper.left").style.left = cssRules.get("--lb-left")?.startsWith("calc(") ? "" : cssRules.get("--lb-left");
		document.getElementById(".fight-stick .trigger-button.right").style.left = cssRules.get("--rt-left")?.startsWith("calc(") ? "" : cssRules.get("--rt-left");
		document.getElementById(".fight-stick .trigger-button.left").style.left = cssRules.get("--lt-left")?.startsWith("calc(") ? "" : cssRules.get("--lt-left");

		document.getElementById(".fight-stick .face.left").style.left = cssRules.get("--dir-right-left")?.startsWith("calc(") ? "" : cssRules.get("--dir-right-left");
		document.getElementById(".fight-stick .face.down").style.left = cssRules.get("--dir-down-left")?.startsWith("calc(") ? "" : cssRules.get("--dir-down-left");
		document.getElementById(".fight-stick .face.right").style.left = cssRules.get("--dir-right-left")?.startsWith("calc(") ? "" : cssRules.get("--dir-right-left");
		document.getElementById(".fight-stick .face.up").style.left = cssRules.get("--dir-up-left")?.startsWith("calc(") ? "" : cssRules.get("--dir-up-left");

		if (cssRules.has("--ls-left")) {
			document.getElementById(".fight-stick .stick.left").style.left = cssRules.get("--ls-left")?.startsWith("calc(") ? "" : cssRules.get("--ls-left");
		}
		if (cssRules.has("--rs-left")) {
			document.getElementById(".fight-stick .stick.right").style.left = cssRules.get("--rs-left")?.startsWith("calc(") ? "" : cssRules.get("--rs-left");
		}

		// Setting visibility.
		document.getElementById(".fight-stick .start").style.visibility = cssRules.get("--visibility-start");
		document.getElementById(".fight-stick .back").style.visibility = cssRules.get("--visibility-back");

		// TODO: set background for layout-box. Might also need to set disconnected elemnt after.

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

function applyCSS(css) {
	var cssObj = cssTokenizer(css);
	for (let [key, properties] of Object.entries(cssObj)) {
		if (key === 'body') {
			continue;
		}
		const style = document.getElementById(key).style;
		if ('top' in properties) {
			style.top = properties['top'];
		}
		if ('left' in properties) {
			style.left = properties['left'];
		}
		if ('background' in properties) {
			style.background = properties['background'];
		}
		if ('visibility' in properties) {
			style.visibility = properties['visibility'];
		}
		if ('width' in properties) {
			style.width = properties['width'];
		}
		if ('height' in properties) {
			style.height = properties['height'];
		}
		if ('border' in properties) {
			style.border = properties['border'];
		}
		if ('border-radius' in properties) {
			style.borderRadius = properties['border-radius'];
		}
		if ('background-position-y' in properties) {
			style.backgroundPositionY = properties['background-position-y'];
		}
		if ('background-image' in properties) {
			style.backgroundImage = properties['background-image'];
		}
		if ('background-size' in properties) {
			style.backgroundSize = properties['background-size'];
		}
		if ('background-repeat' in properties) {
			style.backgroundRepeat = properties['background-repeat'];
		}
		if ('border-radius' in properties) {
			style.borderRadius = properties['border-radius'];
		}
	}
	id2state = new Map();
	updateStatesAndCss(id2state);
}

// Generated by chatgpt.
function cssTokenizer(cssText) {
    let cssMap = {};
    
    // Remove any comments from the CSS text
    cssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

    // Split the CSS text by '}' to separate each rule
    const rules = cssText.split('}');

    rules.forEach(rule => {
        // Split each rule into selector and declarations
        const [selector, declarationText] = rule.split('{');

        if (!selector || !declarationText) return; // Skip if there's no valid rule
        
        const trimmedSelector = selector.trim();
        const declarations = declarationText.trim();

        // Parse declarations into key-value pairs
        const declarationMap = {};
        declarations.split(';').forEach(declaration => {
            // Split only at the first colon to preserve colons in values
            const colonIndex = declaration.indexOf(':');
            if (colonIndex > -1) {
                const property = declaration.slice(0, colonIndex).trim();
                const value = declaration.slice(colonIndex + 1).trim();
                declarationMap[property] = value;
            }
        });

        // Store the parsed declarations for the selector
        if (Object.keys(declarationMap).length > 0) {
            cssMap[trimmedSelector] = declarationMap;
        }
    });

    return cssMap;
}

function moveButtonAndPressedToLocation(btn, top, left) {
	function moveButtonToLocation(btn, top, left) {
		btn.style.top = parseInt(top) + "px";
		btn.style.left = parseInt(left) + "px";
	}
	moveButtonToLocation(btn, top, left);
	if (!btn.id.endsWith(".pressed") && btn.id !== ".fight-stick .fstick") {
		const pressedButton = document.getElementById(btn.id + ".pressed");
		moveButtonToLocation(pressedButton, top, left);
	}
}

function arrowKeyMove(e) {
	if (document.getElementById("moveTab").style.display !== 'block') {
		// Not on move tab.
		return;
	}
	function applyMoveButtonValues(btn, amount, moveVertically) {
		const computedStyle = getComputedStyle(btn);
		if (moveVertically) {
			moveButtonAndPressedToLocation(btn, parseInt(computedStyle.top) - amount, btn.style.left);
		} else {
			moveButtonAndPressedToLocation(btn, btn.style.top, parseInt(computedStyle.left) - amount);
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

	if (moveSelectedButtons.size === 0 || !["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(e.key)) {
		return;
	}
	e.preventDefault();
	for (const button of moveSelectedButtons) {
		moveButton(e, button, moveAmount);
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

	// Removing state from 1-pixel away in order to group arrow-key moves.
	if (e.key === lastKeyPressMove) {
		pastStates.splice(pastStates.length - 2, 1);
	}

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

function setLayoutBoxStyleBackground(url) {
	const layoutBox = document.getElementById("layout-box");
	const urlCss = validImageUrlStyle(url) ? `url(\"${url}\")` : `url(\"${url}.png\")`;
	layoutBox.style.backgroundImage = urlCss;
	layoutBox.style.backgroundSize = "cover";
	layoutBox.style.backgroundRepeat = "no-repeat";
	layoutBox.style.backgroundPosition = "left 0px top 0px";
}

function updateBackground(url) {
	const layoutBox = document.getElementById("layout-box");
	const oldBackgroundImg = layoutBox.style.backgroundImage;
	setLayoutBoxStyleBackground(url);
	// TODO: update layout-box in every instance of this to make this affects state. Update undo/redo.

	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
		const state = getStateOfImg(img);
		id2state.set(img.id, state);
	}
	if (layoutBox.style.backgroundImage !== oldBackgroundImg ) {
		changedVariables +=
		`
		<br>.controller.fight-stick {<br>
			background-image: ${urlCss};<br>
			background-size: auto;<br>
			background-position: left top;<br>
			background-repeat: no-repeat;<br>
		}<br>
		`
	}
	addToPastStates(id2state);
	document.getElementById("css-text").innerHTML = changedVariables;
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

	/**
	 * If I want to add the ability to add text, there's a ways to do it. Something like this
	 * 
	 * 
	 * url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='100%' width='100%'><text text-anchor='middle' dominant-baseline='middle' x='50%' y='50%' paint-order='stroke' fill='red' font-size='500%'>test</text></svg>");
	 * 
	 * <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
   	 * 		<circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
   	 * 		<text text-anchor='middle' dominant-baseline='middle' x='50%' y='58%' paint-order='stroke' fill='red' font-size='500%' style='stroke-width:3px; paint-order:stroke; stroke:#000000; font-family:Lucida Console'> H </text>
   	 * 		Sorry, your browser does not support inline SVG.
	 * </svg> 
	 */

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
	updateStatesAndCss(id2state);
}

function updateStatesAndCss(id2state) {
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
	updateStatesAndCss(id2state);
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
	updateStatesAndCss(id2state);
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
	updateStatesAndCss(id2state);
}

function highlightButton(btn) {
	btn.style.webkitFilter = "drop-shadow(0px 0px 20px yellow)";
}

function unhighlightButton(btn) {
	btn.style.webkitFilter = "";
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
	if (!moveSelectedButtons.has(selectedButton)) {
		moveSelectedButtons.add(selectedButton);
		highlightButton(selectedButton);
		if (moveSelectedButtons.size === 2) {
			document.getElementById('swapButton').style.color = "#fff";
		} else {
			document.getElementById('swapButton').style.color = "#999";
		}
		return;
	} else {
		moveSelectedButtons.delete(selectedButton)
		unhighlightButton(selectedButton);
	}
	if (moveSelectedButtons.size === 2) {
		document.getElementById('swapButton').style.color = "#fff";
	} else {
		document.getElementById('swapButton').style.color = "#999";
	}
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
	return false;
}

function swapSelectedButtons() {
	if (moveSelectedButtons.size !== 2) {
		return false;
	}
	const iterator = moveSelectedButtons.values();
	button1 = iterator.next().value;
	button2 = iterator.next().value;
	button1Style = getComputedStyle(button1);
	button2Style = getComputedStyle(button2);
	button1Top = button1Style.top;
	button1Left = button1Style.left;
	moveButtonAndPressedToLocation(button1, button2Style.top, button2Style.left);
	moveButtonAndPressedToLocation(button2, button1Top, button1Left);
	id2state = new Map();
	updateStatesAndCss(id2state);
}

function undo() {
	if (pastStates.length <= 1) {
		return;
	}
	lastKeyPressMove = null;
	currentState = pastStates.pop();
	undoneStates.push(currentState);
	document.getElementById('redoButton').style.color = "#fff";
	baseLayoutUrl = id2state.get(stateMapUrlKey, baseLayoutUrl);
	setLayoutBoxStyleBackground(id2state.get(stateMapBackgroundUrlKey));
	stateToReturnTo = pastStates[pastStates.length - 1];
	for (const [id, locationToReturnTo] of stateToReturnTo.entries()) {
		if (id === stateMapUrlKey || id === stateMapBackgroundUrlKey) {
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
		if (locationToReturnTo.backgroundSize !== currentLocation.backgroundSize) {
			img.style.backgroundSize = locationToReturnTo.backgroundSize;
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
	baseLayoutUrl = id2state.get(stateMapUrlKey, baseLayoutUrl);
	setLayoutBoxStyleBackground(id2state.get(stateMapBackgroundUrlKey));
	document.getElementById('undoButton').style.color = "#fff";
	pastStates.push(stateToReturnTo);
	for (const [id, locationToReturnTo] of stateToReturnTo.entries()) {
		if (id === stateMapUrlKey || id === stateMapBackgroundUrlKey) {
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
		if (locationToReturnTo.backgroundSize !== currentLocation.backgroundSize) {
			img.style.backgroundSize = locationToReturnTo.backgroundSize;
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
	const layoutBox = document.getElementById("layout-box");
	id2state.set(stateMapBackgroundUrlKey, layoutBox.style.backgroundImage);
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
		${style.top !== originalStateOfImg.top ? `top: ${style.top};<br>` : ''}
		${style.left !== originalStateOfImg.left ? `left: ${style.left};<br>` : ''}
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
		case "tutorialTab":
		case "importCSSTab":
			cursorType = "auto";
			break;
		default:
			cursorType = "crosshair";
	}
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (img.className.startsWith("img")) {
			img.style.cursor = cursorType;
		}
		if (cityName === "moveTab" && moveSelectedButtons.has(img)) {
			highlightButton(img);
		} else {
			unhighlightButton(img);
		}
	}
}

window.onload = function() {
	init();
}
