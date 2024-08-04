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
	// console.log("kurttm debug top: " + targ.style.top);
	return false;
}
function stopDrag() {
	drag=false;

	var changedVariables = "";
	for (const img of document.getElementsByTagName('span')) {
		console.log("kurttm debug top: " + img.style.top);
		console.log("kurttm debug left: " + img.style.left);
		// TODO (and not zero? or probably not unchanged);
		if (img.style.top) {
			changedVariables += img.id + "    top: " + img.style.top + ";<br>";
		}
		if (img.style.left) {
			changedVariables += img.id + "    left: " + img.style.left + ";<br>";
		}
	}
	
	document.getElementById("css-text1").innerHTML =
		`:root {<br>
			${changedVariables}
		}`;

	document.getElementById("css-text").value =
		`:root {<br>
			${changedVariables}
		}`;
	console.log("kurttm debug top: " + targ.style.top);
}


function copyText() {
  // Get the text field
  console.log("kurttm debug copyText start");
  var copyText = document.getElementById("css-text1").innerText;

  // Select the text field
//   copyText.select();
//   copyText.setSelectionRange(0, 99999); // For mobile devices

  console.log("kurttm debug copyText: " + copyText);
  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText);
}



window.onload = function() {
	document.onmousedown = startDrag;
	document.onmouseup = stopDrag;
}
