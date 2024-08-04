var pastStates = [];
var selectedButton;
var drag = false;

function init() {
	document.onmousedown = startDrag;
	document.onmouseup = stopDrag;

	pushCurrentStateTo(pastStates);
}

function pushCurrentStateTo(list) {
	id2location = {};
	for (const img of document.getElementsByTagName('span')) {
		const location = { top: img.offsetTop, left: img.offsetLeft };
		id2location = {};
		id2location[img.id] = location;
	}
	list.push(id2location);
}

function startDrag(e) {
	// determine event object
	if (!e) {
		var e = window.event;
	}

	// if(e.preventDefault) e.preventDefault();

	// IE uses srcElement, others use target
	// targ = e.target ? e.target : e.srcElement;
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

	id2location = {};
	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (img.style.top || img.style.left) {
			changedVariables +=
			`
			<br>${img.id} {<br>
				${img.style.top ? `top: ${img.style.top};<br>` : ''}
				${img.style.left ? `left: ${img.style.left};<br>` : ''}
				z index: ${img.style.zIndex}<br>
			}<br>
			`
			const location = { top: img.offsetTop, left: img.offsetLeft };
			id2location = {};
			id2location[img.id] = location;
		}
	}
	pastStates.push(id2location)
	
	document.getElementById("css-text").innerHTML =changedVariables;
	selectedButton = null;

	// document.getElementById("css-text3").value =changedVariables;
}

function copyText() {
  // Get the text field
  var copyText = document.getElementById("css-text").innerText;

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText);
}

window.onload = function() {
	init();
}
