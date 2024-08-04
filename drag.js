function startDrag(e) {
	// determine event object
	if (!e) {
		var e = window.event;
	}
	if(e.preventDefault) e.preventDefault();

	// IE uses srcElement, others use target
	targ = e.target ? e.target : e.srcElement;

	// calculate event X, Y coordinates
	offsetX = e.clientX;
	offsetY = e.clientY;

	// assign default values for top and left properties
	// if(!targ.style.left) { targ.style.left='0px'};
	// if (!targ.style.top) { targ.style.top='0px'};
	const img = document.getElementById(targ.id);
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
	// move div element
	targ.style.left=coordX+e.clientX-offsetX+'px';
	targ.style.top=coordY+e.clientY-offsetY+'px';
	return false;
}
function stopDrag() {
	drag=false;

	var changedVariables = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
	for (const img of document.getElementsByTagName('span')) {
		if (img.style.top || img.style.left) {
			changedVariables +=
			`
			<br>${img.id} {<br>
				${img.style.top ? `top: ${img.style.top};<br>` : ''}
				${img.style.left ? `left: ${img.style.left};<br>` : ''}
			}<br>
			`
		}
	}
	
	document.getElementById("css-text1").innerHTML =changedVariables;

	document.getElementById("css-text").value =changedVariables;
}


function copyText() {
  // Get the text field
  var copyText = document.getElementById("css-text1").innerText;

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText);
}



window.onload = function() {
	document.onmousedown = startDrag;
	document.onmouseup = stopDrag;
}
