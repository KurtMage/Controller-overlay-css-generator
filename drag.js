var originalState = new Map();
var pastStates = [];
var undoneStates = [];
var selectedButton;
var lastMovedButton;
var drag = false;
var urlImageIsGood = false;
var lastKeyPressMove;
var baseLayoutURL = "https://gamepadviewer.com/?p=1&s=7&map=%7B%7D&editcss=https://kurtmage.github.io/hitbox%20layout/2XKO/light-mode.css";

function init() {
	document.onmousedown = clickAction;
	document.onmouseup = stopDrag;
	document.onkeydown = onePxArrowKeyMove;
	setInterval(alternatePreviewPicture, 1000);

	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		const state = getStateOfImg(img);
		originalState.set(img.id, state);
	}
	pastStates.push(originalState);
}

function onePxArrowKeyMove(e) {
	if (!lastMovedButton) {
		return;
	}
	switch (e.key) {
		case "ArrowLeft":
			lastMovedButton.style.left = (parseInt(lastMovedButton.style.left) - 1) + "px";
			break;
		case "ArrowDown":
			lastMovedButton.style.top = (parseInt(lastMovedButton.style.top) + 1) + "px";
			break;
		case "ArrowRight":
			lastMovedButton.style.left = (parseInt(lastMovedButton.style.left) + 1) + "px";
			break;
		case "ArrowUp":
			lastMovedButton.style.top = (parseInt(lastMovedButton.style.top) - 1) + "px";
			break;
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

	document.getElementById('undoButton').style.color = "#fff";
	undoneStates = [];
	document.getElementById('redoButton').style.color = "#999";
	lastKeyPressMove = e.key;
}

function alternatePreviewPicture() {
	const img = document.getElementById("urlButtonPreview");
	const pressButton = img.style.objectPosition === "0% 0%";
	img.style.objectPosition = `0% ${pressButton ? '100%' : '0%'}`;
}

function updatePreviewPicture() {
	const img = document.getElementById("urlButtonPreview");
	const url = document.getElementById("urlInput").value;
	img.src = `${url}.png`;
}

function checkImage(success) {
	const img = document.getElementById("urlButtonPreview");
	const urlInputBox = document.getElementById("urlInput");
	const closeErrorButton = document.getElementById("closeErrorButton");
	const previewText = document.getElementById("previewText");
	if (success) {
		img.visibility = "visible";
		img.style.width = "150px";
		img.style.height = "150px";
		urlInputBox.style.background = "#ffffff";
		urlInputBox.style.borderColor = "#000000";
		previewText.style.display = "block";
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
		const url = document.getElementById("urlInput").value;
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
		changeButton(e);
	} else if (document.getElementById("changeSizeTab").style.display === 'block') {
		resizeButton(e);
	} else if (document.getElementById("makeButtonsTab").style.display === 'block') {
		applyMadeButton(e);
	}
}

function applyMadeButton(e) {
	targ = e.target ;
	if (!targ.className?.startsWith("img ") || targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}

	const img = document.getElementById(targ.id);
	if (!img) { return; }

	lastKeyPressMove = null;

	const unpressedStyle = getComputedStyle(document.getElementById("unpressedMadeButton"));
	const pressedStyle = getComputedStyle(document.getElementById("pressedMadeButton"));

	img.style.background = unpressedStyle.background;
	img.style.height = unpressedStyle.height;
	img.style.width = unpressedStyle.width;
	img.style.borderRadius = unpressedStyle.borderRadius;
	img.style.border = unpressedStyle.border;

	const pressedImg = document.getElementById(targ.id + ".pressed");

	pressedImg.style.background = pressedStyle.background;
	pressedImg.style.height = pressedStyle.height;
	pressedImg.style.width = pressedStyle.width;
	pressedImg.style.borderRadius = pressedStyle.borderRadius;
	pressedImg.style.border = pressedStyle.border;


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

	const size = parseInt(document.getElementById("sizeInput").value);
	if (isNaN(size) || parseInt(targ.style.backgroundSize) === size) { return; }

	lastKeyPressMove = null;

	targ.style.backgroundSize = `${size}px`;
	targ.style.height = `${size}px`;
	targ.style.width = `${size}px`;

	const pressedImg = document.getElementById(targ.id + ".pressed");

	pressedImg.style.backgroundSize = `${size}px`;
	pressedImg.style.height = `${size}px`;
	pressedImg.style.width = `${size}px`;
	pressedImg.style.backgroundPositionY = `-${size}px`;

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

function changeButton(e) {
	const url = document.getElementById("urlInput").value;
	targ = e.target ;
	if (!targ.className?.startsWith("img ") || targ.tagName?.toUpperCase() != "SPAN" || !urlImageIsGood) {
		return;
	}

	if (!targ) { return; }
	const urlCss = `url(\"${url}.png\")`;
	if (targ.style.backgroundImage === urlCss) {
		return;
	}

	lastKeyPressMove = null;

	targ.style.background = `url(${url}.png)`;

	const imgSize = targ.offsetWidth;
	targ.style.backgroundSize = `${imgSize}px`;
	targ.style.width = `${imgSize}px`;
	targ.style.height = `${imgSize}px`;


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

function dragDiv(e) {
	if (!drag) {return};
	if (!e) { var e= window.event};
	var targ=e.target;
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
	drag=false;
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
		if (locationToReturnTo.isVisible) {
			img.style.visibility = null;
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
	console.log('redo states:');
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
		if (locationToReturnTo.isVisible) {
			img.style.visibility = null;
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
	console.log('redo states:');
	console.log(undoneStates);
}

function copyText() {
  // Get the text field
  var copyText = document.getElementById("css-text").innerText;

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText);
}

function copyLayoutBaseURL() {
    navigator.clipboard.writeText(baseLayoutURL);

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
		|| style.borderRadius !== originalStateOfImg.borderRadius;
}

function addToPastStates(id2state) {
	pastStates.push(id2state);
	document.getElementById('undoButton').style.color = "#fff";
	undoneStates = [];
	document.getElementById('redoButton').style.color = "#999";
	console.log(pastStates);
	console.log('redo states:');
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
		${!style.visibility && backgroundChanged ? `background: ${style.background};<br>` : ''}
		${style.visibility === 'hidden' && !img.id.endsWith(".pressed") ? `background: none;<br>` : ''}
		${style.width !== originalStateOfImg.size ? `width: ${style.width};<br>` : ''}
		${style.width !== originalStateOfImg.size ? `height: ${style.width};<br>` : ''}
		${style.width !== originalStateOfImg.size ? `background-size: ${style.width};<br>` : ''}
		${style.border !== originalStateOfImg.border ? `border: ${style.border};<br>` : ''}
		${style.borderRadius !== originalStateOfImg.borderRadius ? `border-radius: ${style.borderRadius};<br>` : ''}
		${style.backgroundPositionY !== originalStateOfImg.backgroundPositionY ? `background-position-y: ${style.backgroundPositionY};<br>` : ''}
		${style.background !== originalStateOfImg.background ? `background: ${style.background};<br>` : ''}
	}<br>
	`
	// if (style.width != originalStateOfImg.size) {
	// 	changedVariables +=
	// 	`
	// 	<br>${img.id}.pressed {<br>
	// 		background-position-y: ${style.width};<br>
	// 	}<br>
	// 	`
	// }
	return changedVariables;
}

function getStateOfImg(img) {
		const style = getComputedStyle(img);
		return {
			top: style.top,
			left: style.left,
			isVisible: style.visibility === 'visible' || style.visibility === '',
			background: style.background,
			size: style.width,
			borderRadius: style.borderRadius,
			border: style.border,
			backgroundPositionY: style.backgroundPositionY
		};
}

function updateMadeButtonColor(colorPicker, button) {
	document.getElementById(button).style.background = colorPicker.value;
}

function updateMadeButtonSize(value, button) {
	document.getElementById(button).style.width = value + 'px';
	document.getElementById(button).style.height = value + 'px';
}

function updateMadeButtonBorderColor(colorPicker, button) {
	document.getElementById(button).style.borderColor = colorPicker.value;
}

function updateMadeButtonBorderSize(value, button) {
	document.getElementById(button).style.borderWidth = value + 'px';
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
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";

	const cursorType = cityName === 'moveTab' ? "move" : "crosshair";
	for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
		if (img.className.startsWith("img")) {
			img.style.cursor = cursorType;
		}
	}
}

window.onload = function() {
	init();
}
