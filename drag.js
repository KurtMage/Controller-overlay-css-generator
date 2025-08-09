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
var baseLayoutUrl =
  "https://gamepadviewer.com/?p=1&s=7&map=%7B%7D&editcss=https://kurtmage.github.io/hitbox%20layout/console%20controllers/xbox/xbox.css";
var hiddenPressedImgUpdater;
var hiddenUnpressedImgUpdater;
var importButtonInterval;
var mostRecentlyChangedTextBox;
var id2state = new Map();

const stateMapUrlKey = "baseLayoutUrl";
const stateMapBackgroundUrlKey = "backgroundUrl";

document.addEventListener("DOMContentLoaded", function () {
  init();
});

function init() {
  setupFonts(
    "unpressedFontDropdownContainer",
    "unpressed-font-search-input",
    "unpressed-font-list",
    "unpressedMadeButton"
  );
  setupFonts(
    "pressedFontDropdownContainer",
    "pressed-font-search-input",
    "pressed-font-list",
    "pressedMadeButton"
  );
  for (const img of document
    .getElementById("layout-box")
    .getElementsByTagName("*")) {
    if (img.id.endsWith(".pressed") || img.id === ".fight-stick .fstick") {
      continue;
    }
    const btn = img;
    const btnPressed = document.getElementById(img.id + ".pressed");

    btn.addEventListener("mouseenter", function () {
      btn.setAttribute("hidden", "");
      btnPressed.removeAttribute("hidden");
    });

    btnPressed.addEventListener("mouseleave", function () {
      btn.removeAttribute("hidden");
      btnPressed.setAttribute("hidden", "");
    });
  }

  document.onmousedown = clickAction;
  document.onkeydown = arrowKeyMove;

  hiddenUnpressedImgUpdater = new Image();
  hiddenUnpressedImgUpdater.onload = function () {
    checkImage(
      true,
      this,
      document.getElementById("unpressedButtonUrlInput"),
      document.getElementById("unpressedButtonMakerCloseErrorButton")
    );
  };
  hiddenUnpressedImgUpdater.onerror = function () {
    checkImage(
      false,
      this,
      document.getElementById("unpressedButtonUrlInput"),
      document.getElementById("unpressedButtonMakerCloseErrorButton")
    );
  };
  hiddenPressedImgUpdater = new Image();
  hiddenPressedImgUpdater.onload = function () {
    checkImage(
      true,
      this,
      document.getElementById("pressedButtonUrlInput"),
      document.getElementById("pressedButtonMakerCloseErrorButton")
    );
  };
  hiddenPressedImgUpdater.onerror = function () {
    checkImage(
      false,
      this,
      document.getElementById("pressedButtonUrlInput"),
      document.getElementById("pressedButtonMakerCloseErrorButton")
    );
  };

  switchBaseLayout(baseLayoutUrl, false, false, false);
  originalState = pastStates[0];
  // for (const img of document.getElementById("layout-box").getElementsByTagName('*')) {
  // 	const state = getStateOfImg(img);
  // 	originalState.set(img.id, state);
  // }
  // pastStates.push(originalState);
}

function switchBaseLayout(
  linkToGamepadviewerBaseLayout,
  noopIfCurrentLayout = true,
  async = true,
  writeCss = true
) {
  // No switch.
  if (noopIfCurrentLayout && baseLayoutUrl === linkToGamepadviewerBaseLayout) {
    return;
  }

  var request = new XMLHttpRequest();

  request.addEventListener(
    "load",
    function (evt) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.responseText, "text/html");
      doc.getElementById("body");

      function createStyleEl(cssText) {
        // 1. Create a <style> element and add it to the DOM
        const styleEl = document.createElement("style");
        document.head.appendChild(styleEl);
        styleEl.textContent = cssText;

        return styleEl;
      }

      /**
       * A robust function to find ALL rules that match a given selector.
       * @param {CSSStyleSheet} sheet - The CSSStyleSheet object to search.
       * @param {string} selectorToFind - The specific selector to look for (e.g., '.fight-stick .back.pressed').
       * @returns {Array<CSSStyleRule>} An array of all matching CSSStyleRule objects.
       */
      function findAllRulesBySelector(sheet, selectorToFind) {
        const matchingRules = [];

        // Loop through all the rules in the stylesheet
        for (let i = 0; i < sheet.cssRules.length; i++) {
          const rule = sheet.cssRules[i];

          // We only care about standard style rules
          if (rule.type === CSSRule.STYLE_RULE) {
            // Split the selectorText by the comma to get individual selectors
            const selectors = rule.selectorText.split(",");

            // Check each individual selector for a match
            for (const selector of selectors) {
              // We trim whitespace and do a direct comparison
              if (selector.trim() === selectorToFind) {
                // Add the full rule object to our list of matches
                matchingRules.push(rule);
                // Break from the inner loop to avoid adding the same rule twice
                // if the selector string was malformed (e.g., a,,b)
                break;
              }
            }
          }
        }
        return matchingRules;
      }
      /**
       * Applies all styles from a CSSRule to an HTML element as inline styles.
       * @param {CSSStyleRule} rules - The CSSRule object to copy styles from.
       * @param {HTMLElement} element - The HTML element to apply the styles to.
       */
      function applyAllRulesToElement(rules, element) {
        if (!rules || !element) {
          console.error("Invalid rule or element provided.");
          return;
        }

        for (const rule of rules) {
          // Iterate through all the styles in the rule's style declaration.
          for (let i = 0; i < rule.style.length; i++) {
            const propName = rule.style[i];
            const propValue = rule.style.getPropertyValue(propName);

            // Set the property on the element's style object.
            element.style.setProperty(propName, propValue);
          }
        }
      }
      const styleEl = createStyleEl(doc.body.textContent);

      const buttons = [
        ".fight-stick .x",
        ".fight-stick .y",
        ".fight-stick .a",
        ".fight-stick .b",
        ".fight-stick .bumper.right",
        ".fight-stick .bumper.left",
        ".fight-stick .trigger-button.right",
        ".fight-stick .trigger-button.left",
        ".fight-stick .face.left",
        ".fight-stick .face.down",
        ".fight-stick .face.right",
        ".fight-stick .face.up",
        ".fight-stick .start",
        ".fight-stick .back",
        ".fight-stick .stick.left",
        ".fight-stick .stick.right",

        ".fight-stick .x.pressed",
        ".fight-stick .y.pressed",
        ".fight-stick .a.pressed",
        ".fight-stick .b.pressed",
        ".fight-stick .bumper.right.pressed",
        ".fight-stick .bumper.left.pressed",
        ".fight-stick .trigger-button.right.pressed",
        ".fight-stick .trigger-button.left.pressed",
        ".fight-stick .face.left.pressed",
        ".fight-stick .face.down.pressed",
        ".fight-stick .face.right.pressed",
        ".fight-stick .face.up.pressed",
        ".fight-stick .start.pressed",
        ".fight-stick .back.pressed",
        ".fight-stick .stick.left.pressed",
        ".fight-stick .stick.right.pressed",
      ];
      for (const selector of buttons) {
        const buttonEl = document.getElementById(selector);
        // Reset the button so that changes don't persist.
        buttonEl.removeAttribute("style");
        const rules = findAllRulesBySelector(styleEl.sheet, selector);
        if (buttonEl && rules) {
          applyAllRulesToElement(rules, buttonEl);
          console.log(`Applied styles to ${selector}:`, buttonEl.style.cssText);
        } else if (!rules) {
          console.log(`Could not find the CSS rule for ${selector}.`);
        }
        buttonEl.style.position = "absolute";
        if (buttonEl.id.endsWith(".pressed")) {
          const unpressedButton =
            getPressedOrUnpressedVersionOfButton(buttonEl);
          buttonEl.style.setProperty(
            "background-image",
            getComputedStyle(unpressedButton).backgroundImage
          );
          buttonEl.style.setProperty(
            "left",
            getComputedStyle(unpressedButton).left
          );
          buttonEl.style.setProperty(
            "top",
            getComputedStyle(unpressedButton).top
          );
        }
      }

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

      const layoutBox = document.getElementById("layout-box");
      id2state = new Map();
      var changedVariables =
        "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
      for (const img of layoutBox.getElementsByTagName("*")) {
        // if (!img.id.endsWith(".pressed") && img.id !== (".fight-stick .fstick")) {
        // 	document.getElementById(img.id + ".pressed").style.backgroundImage = img.style.backgroundImage;
        // }
        if (writeCss && doesButtonHaveChange(img)) {
          changedVariables += getChangedVariables(img);
        }
        const state = getStateOfImg(img);
        id2state.set(img.id, state);
      }
      addToPastStates(id2state);
      document.getElementById("css-text").innerHTML = changedVariables;

      // document.getElementById("baseLayoutPreview").innerHTML = layoutBox.innerHTML;
    },
    false
  );

  baseLayoutUrl = linkToGamepadviewerBaseLayout;
  const baseLayoutEditCss = linkToGamepadviewerBaseLayout.split("&editcss=")[1];

  request.open("GET", baseLayoutEditCss, async), request.send();
}

function applyCSS(css) {
  var cssObj = cssTokenizer(css);
  const varProperties = [
    "--text-color",
    "--text-font-size",
    "--text-stroke-color",
    "--text-stroke-width",
    "--text-content",
    "--text-font-family",
  ];
  for (let [key, properties] of Object.entries(cssObj)) {
    if (key === "body") {
      continue;
    }
    const style = document.getElementById(key).style;
    if ("top" in properties) {
      style.top = properties["top"];
    }
    if ("left" in properties) {
      style.left = properties["left"];
    }
    if ("background" in properties) {
      style.background = properties["background"];
    }
    if ("visibility" in properties) {
      style.visibility = properties["visibility"];
      if (key === ".fight-stick .fstick" && style.visibility === "visible") {
        document.getElementById(key).removeAttribute("hidden");
      }
    }
    if ("width" in properties) {
      style.width = properties["width"];
    }
    if ("height" in properties) {
      style.height = properties["height"];
    }
    if ("border" in properties) {
      style.border = properties["border"];
    }
    if ("border-radius" in properties) {
      style.borderRadius = properties["border-radius"];
    }
    if ("background-position-y" in properties) {
      style.backgroundPositionY = properties["background-position-y"];
    }
    if ("background-image" in properties) {
      style.backgroundImage = properties["background-image"];
    }
    if ("background-size" in properties) {
      style.backgroundSize = properties["background-size"];
    }
    if ("background-repeat" in properties) {
      style.backgroundRepeat = properties["background-repeat"];
    }
    if ("border-radius" in properties) {
      style.borderRadius = properties["border-radius"];
    }
    for (const property of varProperties) {
      if (property in properties) {
        style.setProperty(property, properties[property]);
      }
    }
  }
  id2state = new Map();
  updateStatesAndCss(id2state);
}

// Generated by chatgpt.
function cssTokenizer(cssText) {
  let cssMap = {};

  // Remove any comments from the CSS text
  cssText = cssText.replace(/\/\*[\s\S]*?\*\//g, "");

  // Split the CSS text by '}' to separate each rule
  const rules = cssText.split("}");

  rules.forEach((rule) => {
    // Split each rule into selector and declarations
    const [selector, declarationText] = rule.split("{");

    if (!selector || !declarationText) return; // Skip if there's no valid rule

    const trimmedSelector = selector.trim();
    const declarations = declarationText.trim();

    // Parse declarations into key-value pairs
    const declarationMap = {};
    declarations.split(";").forEach((declaration) => {
      // Split only at the first colon to preserve colons in values
      const colonIndex = declaration.indexOf(":");
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
  moveButtonToLocation(btn, top, left, true);
}

function moveButtonToLocation(
  btn,
  top,
  left,
  alsoMovePressedOrUnpressedVersion
) {
  function moveButtonToLocation(btn, top, left) {
    btn.style.top = parseInt(top) + "px";
    btn.style.left = parseInt(left) + "px";
  }
  moveButtonToLocation(btn, top, left);
  // Move pressed/unpressed version.
  // Unlessed it's stick. There's no pressed version of stick.
  if (alsoMovePressedOrUnpressedVersion && btn.id !== ".fight-stick .fstick") {
    var otherVersion = getPressedOrUnpressedVersionOfButton(btn);
    moveButtonToLocation(otherVersion, top, left, false);
  }
}

function arrowKeyMove(e) {
  if (document.getElementById("moveTab").style.display !== "block") {
    // Not on move tab.
    return;
  }
  function applyMoveButtonValues(btn, amount, moveVertically) {
    const computedStyle = getComputedStyle(btn);
    if (moveVertically) {
      moveButtonAndPressedToLocation(
        btn,
        parseInt(computedStyle.top) - amount,
        btn.style.left
      );
    } else {
      moveButtonAndPressedToLocation(
        btn,
        btn.style.top,
        parseInt(computedStyle.left) - amount
      );
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

  if (
    moveSelectedButtons.size === 0 ||
    !["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(e.key)
  ) {
    return;
  }
  e.preventDefault();
  for (const button of moveSelectedButtons) {
    moveButton(e, button, moveAmount);
  }

  id2state = new Map();
  var changedVariables =
    "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
  for (const img of document
    .getElementById("layout-box")
    .getElementsByTagName("*")) {
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
    img.style.objectPosition = `0% ${pressButton ? "100%" : "0%"}`;
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
  const newPos = curPosition + 12.5 > 100 ? 0 : curPosition + 12.5;
  img.style.objectPosition = newPos + "% 0%";
}

function updatePreviewPicture(url, previewPicture) {
  clearInterval(importButtonInterval);
  const img = previewPicture;
  img.src = validImageUrlStyle(url) ? url : `${url}.png`;
  if (!url) {
    img.src = "";
  }
  img.style.objectPosition = "0% 0%";
  if (previewPicture.id === "urlButtonPreview") {
    importButtonInterval = setInterval(alternatePreviewPicture, 1000);
  } else if (previewPicture.id === "stickPreview") {
    importButtonInterval = setInterval(rotateStickPreviewPicture, 300);
  }
}

function setLayoutBoxStyleBackground(url) {
  const layoutBox = document.getElementById("layout-box");
  const urlCss = validImageUrlStyle(url)
    ? `url(\"${url}\")`
    : `url(\"${url}.png\")`;
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
  var changedVariables =
    "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
  for (const img of document
    .getElementById("layout-box")
    .getElementsByTagName("*")) {
    if (doesButtonHaveChange(img)) {
      changedVariables += getChangedVariables(img);
    }
    const state = getStateOfImg(img);
    id2state.set(img.id, state);
  }
  if (layoutBox.style.backgroundImage !== oldBackgroundImg) {
    changedVariables += `
		<br>.controller.fight-stick {<br>
			background-image: ${urlCss};<br>
			background-size: auto;<br>
			background-position: left top;<br>
			background-repeat: no-repeat;<br>
		}<br>
		`;
  }
  addToPastStates(id2state);
  document.getElementById("css-text").innerHTML = changedVariables;
}

function checkImage(
  success,
  img = document.getElementById("urlButtonPreview"),
  urlInputBox = document.getElementById("importedUrlInput"),
  closeErrorButton = document.getElementById("closeErrorButton"),
  previewText = document.getElementById("previewText")
) {
  if (success || urlInputBox.value === "") {
    img.visibility = urlInputBox.value === "" ? "hidden" : "visible";
    const imgSize = img.id === "stickPreview" ? "250px" : "150px";
    img.style.width = urlInputBox.value === "" ? "0px" : imgSize;
    img.style.height = urlInputBox.value === "" ? "0px" : imgSize;
    urlInputBox.style.background = "#ffffff";
    urlInputBox.style.borderColor = "#000000";
    previewText.style.display = urlInputBox.value === "" ? "none" : "block";
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
  if (document.getElementById("moveTab").style.display === "block") {
    startDrag(e);
  } else if (document.getElementById("deleteTab").style.display === "block") {
    deleteButton(e);
  } else if (
    document.getElementById("importButtonsTab").style.display === "block"
  ) {
    importButton(e);
  } else if (
    document.getElementById("changeSizeTab").style.display === "block"
  ) {
    resizeButton(e);
  } else if (
    document.getElementById("makeButtonsTab").style.display === "block"
  ) {
    applyMadeButton(e);
  } else if (
    document.getElementById("importStickTab").style.display === "block"
  ) {
    importStick(e);
  }
}

function importStick(e) {
  const url = document.getElementById("stickImportedUrlInput").value;
  targ = e.target;
  if (
    !targ.className?.startsWith("img ") ||
    targ.tagName?.toUpperCase() != "SPAN" ||
    !urlImageIsGood
  ) {
    return;
  }

  if (!targ) {
    return;
  }
  const fstick = document.getElementById(".fight-stick .fstick");
  if (!fstick.hidden) {
    // TODO error;
    return;
  }

  const urlCss = validImageUrlStyle(url)
    ? `url(\"${url}\")`
    : `url(\"${url}.png\")`;
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
  fstick.style.backgroundImage = validImageUrlStyle(url)
    ? `url("${url}")`
    : `url("${url}.png")`;
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

  targ = e.target;
  // TODO give error if they try to do this on a stick
  if (
    !targ.className?.startsWith("img ") ||
    targ.tagName?.toUpperCase() != "SPAN" ||
    targ.id === ".fight-stick .fstick" ||
    !targ
  ) {
    return;
  }

  // If right click, copy the style.
  if (e.button === 2) {
    // e.preventDefault();
    var unpressedMadeButtonEl = document.getElementById("unpressedMadeButton");
    var pressedMadeButtonEl = document.getElementById("pressedMadeButton");
    resetButton(unpressedMadeButtonEl);
    resetButton(pressedMadeButtonEl);

    copyButtonFrom(targ, pressedMadeButtonEl);
    copyButtonFrom(
      getPressedOrUnpressedVersionOfButton(targ),
      unpressedMadeButtonEl
    );

    function putPropertiesIntoInputFields(
      pressedOrUnpressedString,
      madeButtonEl
    ) {
      const madeButtonStyle = getComputedStyle(madeButtonEl);
      document.getElementById(
        `${pressedOrUnpressedString}-button-colorpicker`
      ).value = cssStyleColorToColorHex(madeButtonStyle.backgroundColor);
      document.getElementById(`${pressedOrUnpressedString}Size`).value =
        parseInt(madeButtonStyle.width);
      document.getElementById(
        `${pressedOrUnpressedString}-border-colorpicker`
      ).value = cssStyleColorToColorHex(madeButtonStyle.borderColor);
      document.getElementById(
        `${pressedOrUnpressedString}BorderThickness`
      ).value = parseInt(madeButtonStyle.borderWidth);

      const unpressedTextColor =
        unpressedMadeButtonEl.style.getPropertyValue("--text-color");
      document.getElementById(
        `${pressedOrUnpressedString}-text-colorpicker`
      ).value = cssStyleColorToColorHex(unpressedTextColor);
      document.getElementById(
        `${pressedOrUnpressedString}-text-opacity-range`
      ).value = cssStyleColorToAlphaPercent(unpressedTextColor);
      document.getElementById(
        `${pressedOrUnpressedString}-text-opacity-number`
      ).value = cssStyleColorToAlphaPercent(unpressedTextColor);

      document.getElementById(`${pressedOrUnpressedString}TextSize`).value =
        madeButtonStyle.getPropertyValue("--text-font-size").replace("px", "");
      document.getElementById(
        `${pressedOrUnpressedString}-text-border-colorpicker`
      ).value = cssStyleColorToColorHex(
        madeButtonStyle.getPropertyValue("--text-stroke-color")
      );
      document.getElementById(
        `${pressedOrUnpressedString}-text-border-thickness`
      ).value = madeButtonStyle
        .getPropertyValue("--text-stroke-width")
        .replace("px", "");
      document.getElementById(`${pressedOrUnpressedString}TextContent`).value =
        madeButtonStyle.getPropertyValue("--text-content").replace(/"/g, "");
      document.getElementById(
        `${pressedOrUnpressedString}-font-search-input`
      ).value = madeButtonStyle
        .getPropertyValue("--text-font-family")
        .replace(/"/g, "");

      const justUrl = madeButtonStyle.backgroundImage
        .replace(/^url\(['"]?/, "")
        .replace(/['"]?\)$/, "")
        .replace(/^none$/, "");
      document.getElementById(
        `${pressedOrUnpressedString}ButtonUrlInput`
      ).value = justUrl;
      document.getElementById(`${pressedOrUnpressedString}ImgSize`).value =
        parseInt(madeButtonStyle.backgroundSize);
    }
    putPropertiesIntoInputFields("pressed", pressedMadeButtonEl);
    putPropertiesIntoInputFields("unpressed", unpressedMadeButtonEl);
    return;
  }

  lastKeyPressMove = null;

  // Reset anything that import may have done.
  resetButtonAndPressedOrUnpressedVersion(targ);

  copyButtonFrom(document.getElementById("pressedMadeButton"), targ);

  const unpressedImg = document.getElementById(targ.id.slice(0, -8));
  copyButtonFrom(document.getElementById("unpressedMadeButton"), unpressedImg);

  id2state = new Map();
  updateStatesAndCss(id2state);
}

function copyButtonFrom(copyFromButtonEl, copyToButtonEl) {
  const copyFromButtonStyle = getComputedStyle(copyFromButtonEl);
  const properties = [
    "--text-color",
    "--text-font-size",
    "--text-stroke-color",
    "--text-stroke-width",
    "--text-content",
    "--text-font-family",
  ];
  copyToButtonEl.style.background = "none";
  copyToButtonEl.style.backgroundColor = copyFromButtonStyle.backgroundColor;
  copyToButtonEl.style.height = copyFromButtonStyle.height;
  copyToButtonEl.style.width = copyFromButtonStyle.width;
  copyToButtonEl.style.borderRadius = copyFromButtonStyle.borderRadius;
  copyToButtonEl.style.border = copyFromButtonStyle.border;
  copyToButtonEl.style.backgroundImage = copyFromButtonStyle.backgroundImage;
  copyToButtonEl.style.backgroundSize = copyFromButtonStyle.backgroundSize;
  copyToButtonEl.style.backgroundRepeat = copyFromButtonStyle.backgroundRepeat;
  copyToButtonEl.style.backgroundPosition =
    copyFromButtonStyle.backgroundPosition;
  for (const property of properties) {
    copyToButtonEl.style.setProperty(
      property,
      copyFromButtonStyle.getPropertyValue(property)
    );
  }
  if (!copyFromButtonStyle.getPropertyValue("--text-content")) {
    copyToButtonEl.style.setProperty("--text-content", '""');
  }
  if (!copyFromButtonStyle.getPropertyValue("--text-font-family")) {
    copyToButtonEl.style.setProperty("--text-content", "Helvetica Neue LT Pro");
  }
}

function updateStatesAndCss(id2state) {
  var changedVariables =
    "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
  for (const img of document
    .getElementById("layout-box")
    .getElementsByTagName("*")) {
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
  targ = e.target;
  if (
    !targ.className?.startsWith("img ") ||
    targ.tagName?.toUpperCase() != "SPAN"
  ) {
    return;
  }
  resizeButtonTarget(targ);
}

function resizeButtonTarget(targ, alsoResizePressedOrUnpressedVersion = true) {
  console.log("resize");

  style = getComputedStyle(targ);
  const size = parseInt(document.getElementById("sizeInput").value);
  if (isNaN(size) || style.width === size) {
    return;
  }

  lastKeyPressMove = null;

  targ.style.backgroundSize = `${size}px`;
  targ.style.height = `${size}px`;
  targ.style.width = `${size}px`;

  // Resize pressed/unpressed version.
  // Unlessed it's stick. There's no pressed version of stick.
  if (
    alsoResizePressedOrUnpressedVersion &&
    targ.id !== ".fight-stick .fstick"
  ) {
    var otherVersion = getPressedOrUnpressedVersionOfButton(targ);
    otherVersion.style.backgroundSize = `${size}px`;
    otherVersion.style.height = `${size}px`;
    otherVersion.style.width = `${size}px`;
  }
  id2state = new Map();
  updateStatesAndCss(id2state);
}

function importButton(e) {
  const urlBox = document.getElementById("importedUrlInput");
  const url = urlBox.value;
  targ = e.target;
  if (
    !targ.className?.startsWith("img ") ||
    targ.tagName?.toUpperCase() != "SPAN" ||
    targ.id === ".fight-stick .fstick" ||
    !urlImageIsGood ||
    !targ
  ) {
    return;
  }

  if (e.button === 2) {
    // e.preventDefault();
    const newUri = targ.style.backgroundImage
      .slice(4, -1)
      .replace(/"/g, "")
      .replace('"', "");
    const newEncodedUri =
      newUri === decodeURI(newUri) ? encodeURI(newUri) : newUri;
    urlBox.value = newEncodedUri;
    updatePreviewPicture(
      urlBox.value,
      document.getElementById("urlButtonPreview")
    );
    return;
  }

  const urlCss = validImageUrlStyle(url)
    ? `url(\"${url}\")`
    : `url(\"${url}.png\")`;
  if (targ.style.backgroundImage === urlCss) {
    return;
  }

  lastKeyPressMove = null;

  // Reset anything that make button may have done.
  resetButtonAndPressedOrUnpressedVersion(targ);

  // targ.style.backgroundImage = `url(https://imgur.com/hNxfRJI.png)`;
  targ.style.backgroundImage = validImageUrlStyle(url)
    ? `url("${url}")`
    : `url("${url}.png")`;
  const imgSize = targ.offsetWidth;
  // targ.style.backgroundSize = `${imgSize}px`;
  targ.style.width = `${imgSize}px`;
  targ.style.height = `${imgSize}px`;
  targ.style.backgroundPositionY = `100%`;

  // Should always be true, but protecting just in case.
  if (targ.id.endsWith(".pressed")) {
    const unpressedImg = document.getElementById(targ.id.slice(0, -8));
    unpressedImg.style.backgroundImage = validImageUrlStyle(url)
      ? `url("${url}")`
      : `url("${url}.png")`;
    // pressedImg.style.backgroundSize = `${imgSize}px`;
    unpressedImg.style.width = `${imgSize}px`;
    unpressedImg.style.height = `${imgSize}px`;
    unpressedImg.style.backgroundPositionY = `0%`;
  }

  id2state = new Map();
  updateStatesAndCss(id2state);
}

function deleteButton(e) {
  // determine event object
  if (!e) {
    var e = window.event;
  }

  targ = e.target;
  if (
    !targ.className?.startsWith("img ") ||
    targ.tagName?.toUpperCase() != "SPAN"
  ) {
    return;
  }
  // assign default values for top and left properties
  const img = document.getElementById(targ.id);
  if (!img) {
    return;
  }

  lastKeyPressMove = null;

  img.style.zIndex = -1;

  targ.style.visibility = "hidden";
  var otherVersion = getPressedOrUnpressedVersionOfButton(targ);
  otherVersion.style.visibility = "hidden";

  id2state = new Map();
  updateStatesAndCss(id2state);
}

function highlightButton(btn, alsoHighlightPressedOrUnpressedVersion = true) {
  btn.style.webkitFilter = "drop-shadow(0px 0px 20px yellow)";
  // Also highlight the pressed version. Stick doesn't have pressed version.
  if (
    alsoHighlightPressedOrUnpressedVersion &&
    btn.id !== ".fight-stick .fstick"
  ) {
    var otherVersion = getPressedOrUnpressedVersionOfButton(btn);
    highlightButton(otherVersion, false);
  }
}

function unhighlightButton(
  btn,
  alsoUnhighlightPressedOrUnpressedVersion = true
) {
  btn.style.webkitFilter = "";
  if (
    alsoUnhighlightPressedOrUnpressedVersion &&
    btn.id !== ".fight-stick .fstick"
  ) {
    var otherVersion = getPressedOrUnpressedVersionOfButton(btn);
    unhighlightButton(otherVersion, false);
  }
}

function getPressedOrUnpressedVersionOfButton(btn) {
  if (btn.id.endsWith(".pressed")) {
    return document.getElementById(btn.id.substring(0, btn.id.length - 8));
  }
  return document.getElementById(btn.id + ".pressed");
}

function startDrag(e) {
  lastKeyPressMove = null;
  // determine event object
  if (!e) {
    var e = window.event;
  }

  const targ = e.target;
  if (
    !targ.className?.startsWith("img ") ||
    targ.tagName?.toUpperCase() != "SPAN"
  ) {
    return;
  }
  if (e.preventDefault) e.preventDefault();

  // calculate event X, Y coordinates
  const offsetX = e.clientX;
  const offsetY = e.clientY;

  // assign default values for top and left properties
  selectedButton = targ;
  if (!moveSelectedButtons.has(selectedButton)) {
    moveSelectedButtons.add(selectedButton);
    // // We want to make sure we move both versions of the button;
    // moveSelectedButtons.add(getPressedOrUnpressedVersionOfButton(selectedButton));
    highlightButton(selectedButton);
    if (moveSelectedButtons.size === 2) {
      document.getElementById("swapButton").style.color = "#fff";
    } else {
      document.getElementById("swapButton").style.color = "#999";
    }
    return;
  } else {
    moveSelectedButtons.delete(selectedButton);
    unhighlightButton(selectedButton);
  }
  // 2 buttons, with a pressed and unpressed version. So 4.
  if (moveSelectedButtons.size === 2) {
    document.getElementById("swapButton").style.color = "#fff";
  } else {
    document.getElementById("swapButton").style.color = "#999";
  }
  lastMovedButton = targ;
  targ.style.zIndex = 1;
  if (!targ.style.left) {
    targ.style.left = targ.offsetLeft + "px";
  }
  if (!targ.style.top) {
    targ.style.top = targ.offsetTop + "px";
  }

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
  const currentState = pastStates.pop();
  undoneStates.push(currentState);
  document.getElementById("redoButton").style.color = "#fff";
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
    img.style.setProperty("--text-color", locationToReturnTo.textColor);
    img.style.setProperty("--text-font-size", locationToReturnTo.textFontSize);
    img.style.setProperty(
      "--text-stroke-color",
      locationToReturnTo.textStrokeColor
    );
    img.style.setProperty(
      "--text-stroke-width",
      locationToReturnTo.textStrokeWidth
    );
    img.style.setProperty("--text-content", locationToReturnTo.textContent);
    img.style.setProperty(
      "--text-font-family",
      locationToReturnTo.textFontFamily
    );
  }

  var changedVariables =
    "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
  for (const img of document
    .getElementById("layout-box")
    .getElementsByTagName("*")) {
    if (doesButtonHaveChange(img)) {
      changedVariables += getChangedVariables(img);
    }
  }
  document.getElementById("css-text").innerHTML = changedVariables;

  if (pastStates.length <= 1) {
    document.getElementById("undoButton").style.color = "#999";
  }
  console.log(pastStates);
  console.log(undoneStates);
}

function redo() {
  if (undoneStates.length <= 0) {
    return;
  }
  lastKeyPressMove = null;
  const currentState = pastStates[pastStates.length - 1];
  stateToReturnTo = undoneStates.pop();
  baseLayoutUrl = id2state.get(stateMapUrlKey, baseLayoutUrl);
  setLayoutBoxStyleBackground(id2state.get(stateMapBackgroundUrlKey));
  document.getElementById("undoButton").style.color = "#fff";
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
      img.style.visibility = "hidden";
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
    img.style.setProperty("--text-color", locationToReturnTo.textColor);
    img.style.setProperty("--text-font-size", locationToReturnTo.textFontSize);
    img.style.setProperty(
      "--text-stroke-color",
      locationToReturnTo.textStrokeColor
    );
    img.style.setProperty(
      "--text-stroke-width",
      locationToReturnTo.textStrokeWidth
    );
    img.style.setProperty("--text-content", locationToReturnTo.textContent);
    img.style.setProperty(
      "--text-font-family",
      locationToReturnTo.textFontFamily
    );
  }

  var changedVariables =
    "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }<br>";
  for (const img of document
    .getElementById("layout-box")
    .getElementsByTagName("*")) {
    if (doesButtonHaveChange(img)) {
      changedVariables += getChangedVariables(img);
    }
  }
  document.getElementById("css-text").innerHTML = changedVariables;

  if (undoneStates.length < 1) {
    document.getElementById("redoButton").style.color = "#999";
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
  return (
    style.top !== originalStateOfImg.top ||
    style.left !== originalStateOfImg.left ||
    (!img.id.endsWith(".pressed") && style.visibility === "hidden") ||
    style.background !== originalStateOfImg.background ||
    style.width !== originalStateOfImg.size ||
    style.border !== originalStateOfImg.border ||
    style.borderRadius !== originalStateOfImg.borderRadius ||
    style.backgroundImage !== originalStateOfImg.backgroundImage ||
    style.backgroundSize !== originalStateOfImg.backgroundSize ||
    style.backgroundRepeat !== originalStateOfImg.backgroundRepeat ||
    style.backgroundPosition !== originalStateOfImg.backgroundPosition ||
    style.getPropertyValue("--text-color") !== originalStateOfImg.textColor ||
    style.getPropertyValue("--text-font-size") !==
      originalStateOfImg.textFontSize ||
    style.getPropertyValue("--text-stroke-color") !==
      originalStateOfImg.textStrokeColor ||
    style.getPropertyValue("--text-stroke-width") !==
      originalStateOfImg.textStrokeWidth ||
    style.getPropertyValue("--text-content") !==
      originalStateOfImg.textContent ||
    style.getPropertyValue("--text-font-family") !==
      originalStateOfImg.textFontFamily
  );
}

function addToPastStates(id2state) {
  id2state.set(stateMapUrlKey, baseLayoutUrl);
  const layoutBox = document.getElementById("layout-box");
  id2state.set(stateMapBackgroundUrlKey, layoutBox.style.backgroundImage);
  pastStates.push(id2state);
  document.getElementById("undoButton").style.color = "#fff";
  undoneStates = [];
  document.getElementById("redoButton").style.color = "#999";
  console.log(pastStates);
  console.log(undoneStates);
}

function getChangedVariables(img) {
  const style = getComputedStyle(img);
  const originalStateOfImg = originalState.get(img.id);
  var changedVariables = "";
  const backgroundChanged = style.background !== originalStateOfImg.background;
  const indentation = "";

  const properties = [
    "--text-color",
    "--text-font-size",
    "--text-stroke-color",
    "--text-stroke-width",
    "--text-content",
    "--text-font-family",
  ];

  function kebabToCamelCase(str) {
    return str.replace(/-./g, (match) => match[1].toUpperCase());
  }
  const propertyStyles = properties
    .map((property) => {
      // Use a conditional (ternary) operator to decide which string to return
      return style.getPropertyValue(property) !==
        originalStateOfImg[kebabToCamelCase(property.slice(2))] // Remove the "--" prefix.
        ? `${property}: ${style.getPropertyValue(property)};<br>`
        : "";
    })
    .join("");
  changedVariables += `
	<br>${img.id} {<br>
		${
      style.top !== originalStateOfImg.top
        ? `${indentation}top: ${style.top};<br>`
        : ""
    }
		${
      style.left !== originalStateOfImg.left
        ? `${indentation}left: ${style.left};<br>`
        : ""
    }
		${
      style.visibility !== "hidden" && backgroundChanged
        ? `${indentation}background: ${style.background};<br>`
        : ""
    }
		${
      style.visibility !== originalStateOfImg.visibility
        ? `${indentation}visibility: ${style.visibility};<br>`
        : ""
    }
		${
      style.width !== originalStateOfImg.size
        ? `${indentation}width: ${style.width};<br>`
        : ""
    }
		${
      style.width !== originalStateOfImg.size
        ? `${indentation}height: ${style.width};<br>`
        : ""
    }
		${
      style.border !== originalStateOfImg.border
        ? `${indentation}border: ${style.border};<br>`
        : ""
    }
		${
      style.borderRadius !== originalStateOfImg.borderRadius
        ? `${indentation}border-radius: ${style.borderRadius};<br>`
        : ""
    }
		${
      style.backgroundPositionY !== originalStateOfImg.backgroundPositionY
        ? `${indentation}background-position-y: ${style.backgroundPositionY};<br>`
        : ""
    }
		${
      style.backgroundImage !== originalStateOfImg.backgroundImage
        ? `${indentation}background-image: ${style.backgroundImage};<br>`
        : ""
    }
		${
      style.backgroundSize !== originalStateOfImg.backgroundSize
        ? `${indentation}background-size: ${style.backgroundSize};<br>`
        : ""
    }
		${
      style.backgroundRepeat !== originalStateOfImg.backgroundRepeate
        ? `${indentation}background-repeat: ${style.backgroundRepeat};<br>`
        : ""
    }
		${
      style.backgroundPosition !== originalStateOfImg.backgroundPosition
        ? `${indentation}background-image: ${style.backgroundPosition};<br>`
        : ""
    }
		${
      style.borderRadius !== originalStateOfImg.borderRadius
        ? `${indentation}border-radius: ${style.borderRadius};<br>`
        : ""
    }
		${
      style.borderColor !== originalStateOfImg.borderColor
        ? `${indentation}border-color: ${style.borderColor};<br>`
        : ""
    }
		${propertyStyles}
	}<br>
	`;
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
    textColor: style.getPropertyValue("--text-color"),
    textFontSize: style.getPropertyValue("--text-font-size"),
    textStrokeColor: style.getPropertyValue("--text-stroke-color"),
    textStrokeWidth: style.getPropertyValue("--text-stroke-width"),
    textContent: style.getPropertyValue("--text-content"),
    textFontFamily: style.getPropertyValue("--text-font-family"),
  };
}

function updateMadeButtonColor(colorValue, button) {
  button.style.backgroundColor = colorValue;
}

function updateMadeButtonSize(value, button) {
  button.style.width = value + "px";
  button.style.height = value + "px";
}

function updateMadeButtonBorderColor(colorValue, button) {
  button.style.borderColor = colorValue;
}

function updateMadeButtonBorderSize(value, button) {
  button.style.borderWidth = value + "px";
}

function updateMadeButtonTextContent(textContentValue, button) {
  button.style.setProperty("--text-content", '"' + textContentValue + '"');
}

function syncOpacityInputs(opacityRangeEl, opacityNumberEl) {
  if (document.activeElement === opacityRangeEl) {
    opacityNumberEl.value = opacityRangeEl.value;
  } else {
    // Ensure the number is within the valid range (0-100)
    const clampedValue = Math.min(
      Math.max(opacityNumberEl.value, opacityRangeEl.min),
      opacityRangeEl.max
    );
    opacityRangeEl.value = clampedValue;
    opacityNumberEl.value = clampedValue;
  }
}

function hexRgbToRgba(hexcolor, alphaPercent) {
  // Convert alpha from 0-100 range to 0-255 range
  const alphaValue = Math.round((alphaPercent * 255) / 100);
  let hexAlpha = alphaValue.toString(16).toUpperCase();

  if (hexAlpha.length === 1) {
    hexAlpha = "0" + hexAlpha;
  }

  // Combine the original hex color with the new alpha hex value
  return `${hexcolor}${hexAlpha}`;
}

/**
 *
 * @param {} colorString in rgb() or rgba() format.
 * @returns
 */
function cssStyleColorToColorHex(colorString) {
  if (colorString === "" || colorString === "transparent") {
    return "#000000"; // Default to black if no color is specified
  }
  const sixDigitMatch = colorString.match(/^#([0-9a-fA-F]{6})$/);
  if (sixDigitMatch) {
    // If it's a 6-digit hex, return it directly.
    return `#${sixDigitMatch[1]}`;
  }

  const hexaMatch = colorString.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})$/);
  if (hexaMatch) {
    // If it's an 8-digit hex, extract color and alpha.
    hexColor = `#${hexaMatch[1]}`;
    return hexColor;
  }

  const match = colorString.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (!match) {
    console.error("Could not parse background color string:", colorString);
    return;
  }
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const hexR = r.toString(16).padStart(2, "0");
  const hexG = g.toString(16).padStart(2, "0");
  const hexB = b.toString(16).padStart(2, "0");
  return `#${hexR}${hexG}${hexB}`;
}

function cssStyleColorToAlphaPercent(colorString) {
  if (colorString === "" || colorString === "transparent") {
    return 0; // Default to 0 if no color is specified.
  }
  const sixDigitMatch = colorString.match(/^#([0-9a-fA-F]{6})$/);
  if (sixDigitMatch) {
    // If it's a 6-digit hex, return it directly.
    return 100; // 100% opacity
  }
  const hexaMatch = colorString.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})$/);
  if (hexaMatch) {
    // If it's an 8-digit hex, extract color and alpha.
    const hexAlpha = hexaMatch[2];
    const decimalAlpha = parseInt(hexAlpha, 16);
    alphaPercentage = Math.round((decimalAlpha / 255) * 100);
    return alphaPercentage;
  }
  const match = colorString.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (!match) {
    console.error("Could not parse background color string:", colorString);
    return;
  }
  const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1; // Default to 1 if no alpha is present

  return Math.round(alpha * 100);
}

function updateMadeButtonTextColorAndSyncOpacity(
  pressedOrUnpressedStr,
  button
) {
  colorpickerEl = document.getElementById(
    `${pressedOrUnpressedStr}-text-colorpicker`
  );
  opacityRangeEl = document.getElementById(
    `${pressedOrUnpressedStr}-text-opacity-range`
  );
  opacityNumberEl = document.getElementById(
    `${pressedOrUnpressedStr}-text-opacity-number`
  );
  syncOpacityInputs(opacityRangeEl, opacityNumberEl);
  button.style.setProperty(
    "--text-color",
    hexRgbToRgba(colorpickerEl.value, opacityRangeEl.value)
  );
}

function updateMadeButtonTextFont(textFontFamilyValue, button) {
  button.style.setProperty(
    "--text-font-family",
    '"' + textFontFamilyValue + '"'
  );
}

function updateMadeButtonTextSize(textSizeValue, button) {
  button.style.setProperty("--text-font-size", textSizeValue + "px");
}

function updateMadeButtonTextBorderColor(textStrokeColorValue, button) {
  button.style.setProperty("--text-stroke-color", textStrokeColorValue);
}

function updateMadeButtonTextBorderThickness(textStrokeThickness, button) {
  button.style.setProperty("--text-stroke-width", textStrokeThickness + "px");
}

function updateMadeButtonTextContent(textContentValue, button) {
  button.style.setProperty("--text-content", '"' + textContentValue + '"');
}

function updateMadeButtonTextFont(textFontFamilyValue, button) {
  button.style.setProperty(
    "--text-font-family",
    '"' + textFontFamilyValue + '"'
  );
}

function updateMadeButtonTextSize(textSizeValue, button) {
  button.style.setProperty("--text-font-size", "" + textSizeValue + "px");
}

function updateMadeButtonImg(url, button) {
  mostRecentlyChangedTextBox = button;
  button.style.backgroundImage = validImageUrlStyle(url)
    ? `url("${url}")`
    : `url("${url}.png")`;
  if (!url) {
    button.style.backgroundImage = "";
  }
  const fixedUrl = validImageUrlStyle(url) ? url : `${url}.png`;
  if (button.id.startsWith("unpressed")) {
    hiddenUnpressedImgUpdater.src = url ? fixedUrl : "";
  } else if (button.id.startsWith("pressed")) {
    hiddenPressedImgUpdater.src = url ? fixedUrl : "";
  }

  button.style.backgroundRepeat = "no-repeat";
  button.style.backgroundPosition = "center";
  // updateMadeButtonImgSize(document.getElementById("unpressedImgSize").value, button);
}

function updateMadeButtonImgSize(size, button) {
  button.style.backgroundSize = size + "px";
}

function initializeMadeButton(
  madeButton,
  url,
  imgSize,
  buttonColorValue,
  buttonSize,
  borderColorValue,
  borderSize
) {
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

function resetButton(button) {
  button.style.background = "";
  button.style.backgroundColor = "";
  button.style.borderRadius = "";
  button.style.border = "";
  button.style.backgroundImage = "";
  button.style.backgroundSize = "";
  button.style.backgroundRepeat = "";
  button.style.backgroundPosition = "";
  button.style.borderColor = "";
  const properties = [
    "--text-color",
    "--text-font-size",
    "--text-stroke-color",
    "--text-stroke-width",
    "--text-content",
    "--text-font-family",
  ];
  for (const property of properties) {
    button.style.removeProperty(property);
  }
}

function resetButtonAndPressedOrUnpressedVersion(button) {
  resetButton(button);

  // Probably a redundant check, because Make/Import already can't be applies to pressed.
  if (button.id !== ".fight-stick .fstick") {
    const otherVersion = getPressedOrUnpressedVersionOfButton(button);
    resetButton(otherVersion);
  }
}

function setupFonts(fontContainerId, fontInputId, fontListId, buttonId) {
  const fontContainer = document.getElementById(fontContainerId);
  const fontInput = document.getElementById(fontInputId);
  const fontList = document.getElementById(fontListId);

  const fonts = [
    "Helvetica Neue LT Pro",
    "Arial",
    "Verdana",
    "Helvetica",
    "Tahoma",
    "Trebuchet MS",
    "Times New Roman",
    "Georgia",
    "Garamond",
    "Courier New",
    "Brush Script MT",
    "Palatino",
    "Lucida Sans",
    "Copperplate",
    "Futura",
    "Avenir",
    "Franklin Gothic",
    "Gill Sans",
    "Impact",
    "Lato",
    "Montserrat",
    "Open Sans",
    "Oswald",
    "Poppins",
    "Raleway",
    "Roboto",
    "Source Sans Pro",
    "Merriweather",
    "Playfair Display",
    "Noto Serif",
    "Cormorant Garamond",
    "EB Garamond",
  ];

  fontList.innerHTML = fonts
    .map((font) => `<li style="font-family: '${font}'">${font}</li>`)
    .join("");

  // Toggle the dropdown on clicking the input field
  fontInput.addEventListener("click", (event) => {
    event.stopPropagation();
    fontContainer.classList.toggle("open");
  });

  // Event listener to hide the dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!fontContainer.contains(event.target)) {
      fontContainer.classList.remove("open");
    }
  });

  // Event listener for font selection from the list
  fontList.addEventListener("click", (event) => {
    if (event.target.tagName === "LI") {
      const selectedFont = event.target.textContent;
      fontInput.value = selectedFont;

      const button = document.getElementById(buttonId);
      updateMadeButtonTextFont(selectedFont, button);

      setTimeout(() => {
        fontContainer.classList.remove("open");
      }, 0);
    }
  });

  // Event listener for filtering the list as the user types
  fontInput.addEventListener("input", () => {
    const filter = fontInput.value.toLowerCase();
    const items = fontList.querySelectorAll("li");
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(filter) ? "block" : "none";
    });
    fontContainer.classList.add("open");
  });
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
  for (const img of document
    .getElementById("layout-box")
    .getElementsByTagName("*")) {
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
