var originalState = new Map();
var pastStates = [];
var undoneStates = [];
var selectedButton;
var drag = false;

function init() {
	document.onmousedown = clickAction;
	document.onmouseup = stopDrag;

	for (const img of document.getElementsByTagName('span')) {
		const state = getStateOfImg(img);
		originalState.set(img.id, state);
	}
	pastStates.push(originalState);
}

function clickAction(e) {
	if (document.getElementById("moveTab").style.display === 'block') {
		startDrag(e);
	} else if (document.getElementById("deleteTab").style.display === 'block') {
		deleteButton(e);
	} else if (document.getElementById("changeButtonsTab").style.display === 'block') {
		changeButton(e);
	} else if (document.getElementById("changeSizeTab").style.display === 'block') {
		resizeButton(e);
	}
}

function resizeButton(e) {
	targ = e.target ;
	if (targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}

	const img = document.getElementById(targ.id);
	if (!img) { return; }
	const size = parseInt(document.getElementById("sizeInput").value);
	if (isNaN(size)) { return; }

	img.style.backgroundSize = `${size}px`;
	img.style.height = `${size}px`;
	img.style.width = `${size}px`;


	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
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
	if (targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}

	const img = document.getElementById(targ.id);
	if (!img) { return; }
	img.style.background = `url(${url}.png)`;

	const imgSize = img.offsetWidth;
	img.style.backgroundSize = `${imgSize}px`;
	img.style.width = `${imgSize}px`;
	img.style.height = `${imgSize}px`;


	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
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
	// determine event object
	if (!e) {
		var e = window.event;
	}

	targ = e.target ;
	if (targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}

	// calculate event X, Y coordinates
	offsetX = e.clientX;
	offsetY = e.clientY;

	// assign default values for top and left properties
	const img = document.getElementById(targ.id);
	if (!img) { return; }
	selectedButton = img;
	img.style.zIndex = 1;
	if (!targ.style.left) { targ.style.left=img.offsetLeft + 'px'};
	if (!targ.style.top) { targ.style.top=img.offsetTop + 'px'};

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
	if (targ.tagName?.toUpperCase() != "SPAN") {
		return;
	}
	// assign default values for top and left properties
	const img = document.getElementById(targ.id);
	if (!img) { return; }
	img.style.zIndex = -1;

	targ.style.visibility = "hidden";

	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
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
	if (targ.tagName?.toUpperCase() != "SPAN") {
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

	id2state = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
		const state = getStateOfImg(img);
		id2state.set(img.id, state);
	}
	addToPastStates(id2state);
	console.log(pastStates);
	
	document.getElementById("css-text").innerHTML = changedVariables;
	selectedButton = null;

	// document.getElementById("css-text3").value =changedVariables;
}

function undo() {
	if (pastStates.length <= 1) {
		return;
	}
	currentState = pastStates.pop();
	undoneStates.push(currentState);
	document.getElementById('redoButton').style.color = "#fff";
	stateToReturnTo = pastStates[pastStates.length - 1];
	for (const [id, locationToReturnTo] of stateToReturnTo.entries()) {
		const currentLocation = currentState.get(id);
		const img = document.getElementById(id);
		if (currentLocation.top !== locationToReturnTo.top) {
			img.style.top = locationToReturnTo.top + 'px';
		}
		if (currentLocation.left !== locationToReturnTo.left) {
			img.style.left = locationToReturnTo.left + 'px';
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
	}

	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
	}
	document.getElementById("css-text").innerHTML = changedVariables;

	if (pastStates.length <= 1) {
		document.getElementById('undoButton').style.color = "#999";
	}
}

function redo() {
	if (undoneStates.length <= 0) {
		return;
	}
	currentState = pastStates[pastStates.length - 1];
	stateToReturnTo = undoneStates.pop();
	document.getElementById('undoButton').style.color = "#fff";
	pastStates.push(stateToReturnTo);
	for (const [id, locationToReturnTo] of stateToReturnTo.entries()) {
		const currentLocation = currentState.get(id);
		const img = document.getElementById(id);
		if (currentLocation.top !== locationToReturnTo.top) {
			img.style.top = locationToReturnTo.top + 'px';
		}
		if (currentLocation.left !== locationToReturnTo.left) {
			img.style.left = locationToReturnTo.left + 'px';
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
	}

	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (doesButtonHaveChange(img)) {
			changedVariables += getChangedVariables(img);
		}
	}
	document.getElementById("css-text").innerHTML = changedVariables;

	if (undoneStates.length <= 1) {
		document.getElementById('redoButton').style.color = "#999";
	}
}

function copyText() {
  // Get the text field
  var copyText = document.getElementById("css-text").innerText;

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText);
}

function doesButtonHaveChange(img) {
	const originalStateOfImg = originalState.get(img.id);
    return img.style.top || img.style.left || img.style.visibility == 'hidden'
		|| img.style.background != originalStateOfImg.background
		|| img.style.width != originalStateOfImg.size;
}

function addToPastStates(id2state) {
	pastStates.push(id2state);
	document.getElementById('undoButton').style.color = "#fff";
	undoneStates = [];
	document.getElementById('redoButton').style.color = "#999";
}

function getChangedVariables(img) {
	originalStateOfImg = originalState.get(img.id);
	var changedVariables = '';
	const backgroundChanged = img.style.background != originalStateOfImg.background;
	changedVariables +=
	`
	<br>${img.id} {<br>
		${img.style.top ? `top: ${img.offsetTop}px;<br>` : ''}
		${img.style.left ? `left: ${img.offsetLeft}px;<br>` : ''}
		${!img.style.visibility && backgroundChanged ? `background: ${img.style.background};<br>` : ''}
		${img.style.visibility ? `background: none;<br>` : ''}
		${img.style.width != originalStateOfImg.size ? `width: ${img.style.width};<br>` : ''}
		${img.style.width != originalStateOfImg.size ? `height: ${img.style.width};<br>` : ''}
		${img.style.width != originalStateOfImg.size ? `background-size: ${img.style.width};<br>` : ''}
	}<br>
	`
	if (img.style.width != originalStateOfImg.size) {
		changedVariables +=
		`
		<br>${img.id}.pressed {<br>
			background-position-y: ${img.style.width};<br>
		}<br>
		`
	}
	return changedVariables;
}

function getStateOfImg(img) {
		return {
			top: img.offsetTop,
			left: img.offsetLeft,
			isVisible: img.style.visibility === 'visible' || img.style.visibility === '',
			background: img.style.background,
			size: img.style.width
		};
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
	for (const img of document.getElementsByTagName('span')) {
		img.style.cursor = cursorType;
	}
}

window.onload = function() {
	init();
}
