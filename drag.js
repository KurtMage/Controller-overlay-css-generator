var originalState = new Map();
var pastStates = [];
var undoneStates = [];
var selectedButton;
var drag = false;

function init() {
	document.onmousedown = clickAction;
	document.onmouseup = stopDrag;

	for (const img of document.getElementsByTagName('span')) {
		const state = {
			top: img.offsetTop,
			left: img.offsetLeft,
			isVisible: img.style.visibility === 'visible' || img.style.visibility === ''};
		originalState.set(img.id, state);
	}
	pastStates.push(originalState);
}

function clickAction(e) {
	if (document.getElementById("tabToggle01").checked) {
		startDrag(e);
	} else if (document.getElementById("tabToggle02").checked) {
		deleteButton(e);
	}
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

	id2location = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (doesButtonHaveChange(img)) {
			changedVariables +=
			`
			<br>${img.id} {<br>
				${img.style.top ? `top: ${img.offsetTop};<br>` : ''}
				${img.style.left ? `left: ${img.offsetLeft};<br>` : ''}
				background: none;<br>
			}<br>
			`
		}
		const state = {
			top: img.offsetTop,
			left: img.offsetLeft,
			isVisible: img.style.visibility === 'visible' || img.style.visibility === ''};
		id2location.set(img.id, state);
	}
	addToPastStates(id2location);
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

	id2location = new Map();
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (doesButtonHaveChange(img)) {
			changedVariables +=
			`
			<br>${img.id} {<br>
				${img.style.top ? `top: ${img.offsetTop};<br>` : ''}
				${img.style.left ? `left: ${img.offsetLeft};<br>` : ''}
				z index: ${img.style.zIndex}<br>
			}<br>
			`
		}
		const state = {
			top: img.offsetTop,
			left: img.offsetLeft,
			isVisible: img.style.visibility === 'visible' || img.style.visibility === ''};
		id2location.set(img.id, state);
	}
	addToPastStates(id2location);
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

	}

	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (doesButtonHaveChange(img)) {
			changedVariables +=
			`
			<br>${img.id} {<br>
				${img.style.top ? `top: ${img.offsetTop};<br>` : ''}
				${img.style.left ? `left: ${img.offsetLeft};<br>` : ''}
			}<br>
			`
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
	}

	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (doesButtonHaveChange(img)) {
			changedVariables +=
			`
			<br>${img.id} {<br>
				${img.style.top ? `top: ${img.offsetTop};<br>` : ''}
				${img.style.left ? `left: ${img.offsetLeft};<br>` : ''}
				z index: ${img.style.zIndex}<br>
			}<br>
			`
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
    return img.style.top || img.style.left || img.style.visibility == 'hidden';
}

function addToPastStates(id2location) {
	pastStates.push(id2location);
	document.getElementById('undoButton').style.color = "#fff";
	undoneStates = [];
	document.getElementById('redoButton').style.color = "#999";
}

window.onload = function() {
	init();
}
