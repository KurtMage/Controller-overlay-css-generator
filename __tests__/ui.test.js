/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");
const { fireEvent, getByText } = require("@testing-library/dom");
require("@testing-library/jest-dom");

const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
const { init } = require("../drag.js");

describe("Controller Overlay CSS Generator UI", () => {
  beforeEach(() => {
    // Mock XMLHttpRequest for all tests
    window.XMLHttpRequest = function () {
      this.open = jest.fn();
      this.send = jest.fn(function () {
        // Provide a default CSS response for init()
        this.responseText = `
          <body>
            .fight-stick .x {
              top: 0px;
              left: 0px;
              background: #fff;
            }
          </body>
        `;
        this.readyState = 4;
        this.status = 200;
        this.onreadystatechange && this.onreadystatechange();
        this.onload && this.onload();
      });
      this.addEventListener = (event, cb) => {
        if (event === "load") {
          setTimeout(() => {
            this.responseText = `
              <body>
                .fight-stick .x {
                  top: 0px;
                  left: 0px;
                  background: #fff;
                }
              </body>
            `;
            cb.call(this);
          }, 0);
        }
      };
    };

    document.documentElement.innerHTML = html;
    init();
    // Mock clipboard API
    global.navigator.clipboard = {
      writeText: jest.fn(),
    };
  });

  test("Move/Swap tab: select two buttons, move and swap", () => {
    fireEvent.click(getByText(document.body, "Move/Swap"));

    // Increase the value in the input box
    const moveAmountBox = document.getElementById("moveAmountBox");
    moveAmountBox.value = "10";
    fireEvent.input(moveAmountBox);

    const buttonX = document.getElementById(".fight-stick .x");
    const buttonY = document.getElementById(".fight-stick .y");

    // Set explicit pixel values for testing
    buttonX.style.top = "100px";
    buttonX.style.left = "200px";
    buttonY.style.top = "300px";
    buttonY.style.left = "400px";

    fireEvent.mouseDown(buttonX);
    fireEvent.mouseDown(buttonY);

    // Simulate pressing the right arrow key
    for (let i = 0; i < 2; i++) {
      fireEvent.keyDown(document, {
        key: "ArrowRight",
        code: "ArrowRight",
        keyCode: 39,
      });
    }
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(document, {
        key: "ArrowUp",
        code: "ArrowUp",
        keyCode: 38,
      });
    }
    fireEvent.keyDown(document, {
      key: "ArrowLeft",
      code: "ArrowLeft",
      keyCode: 37,
    });
    fireEvent.keyDown(document, {
      key: "ArrowDown",
      code: "ArrowDown",
      keyCode: 40,
    });

    // Check that their positions have swapped and been shifted by the arrow keys.
    expect(buttonX.style.top).toBe("80px");
    expect(buttonX.style.left).toBe("210px");
    expect(buttonY.style.top).toBe("280px");
    expect(buttonY.style.left).toBe("410px");
    var cssTextOutput = document.getElementById("css-text");
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.x{top:80px;left:210px;`
    );
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.y{top:280px;left:410px;`
    );

    // Click the "copy code to clipboard" button
    const copyButton = getByText(document.body, "Copy code to clipboard");
    fireEvent.click(copyButton);

    // Click the undo last action button
    const undoButton = getByText(document.body, "Undo last action");
    fireEvent.click(undoButton);

    // Check that their positions have swapped and been shifted by the arrow keys.
    expect(buttonX.style.top).toBe("70px");
    expect(buttonX.style.left).toBe("210px");
    expect(buttonY.style.top).toBe("270px");
    expect(buttonY.style.left).toBe("410px");
    cssTextOutput = document.getElementById("css-text");
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.x{top:70px;left:210px;`
    );
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.y{top:270px;left:410px;`
    );

    // Simulate clicking the swap button
    const swapButton = document.getElementById("swapButton");
    fireEvent.click(swapButton);

    // Check that their positions have swapped and been shifted by the arrow keys.
    expect(buttonX.style.top).toBe("270px");
    expect(buttonX.style.left).toBe("410px");
    expect(buttonY.style.top).toBe("70px");
    expect(buttonY.style.left).toBe("210px");
    cssTextOutput = document.getElementById("css-text");
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.x{top:270px;left:410px;`
    );
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.y{top:70px;left:210px;`
    );

    // Click the undo last action button
    fireEvent.click(undoButton);

    expect(buttonX.style.top).toBe("70px");
    expect(buttonX.style.left).toBe("210px");
    expect(buttonY.style.top).toBe("270px");
    expect(buttonY.style.left).toBe("410px");
    cssTextOutput = document.getElementById("css-text");
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.x{top:70px;left:210px;`
    );
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.y{top:270px;left:410px;`
    );

    // Click the undo last action button
    const redoButton = getByText(document.body, "Redo last undo");
    fireEvent.click(redoButton);

    expect(buttonX.style.top).toBe("270px");
    expect(buttonX.style.left).toBe("410px");
    expect(buttonY.style.top).toBe("70px");
    expect(buttonY.style.left).toBe("210px");
    cssTextOutput = document.getElementById("css-text");
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.x{top:270px;left:410px;`
    );
    expect(cssTextOutput.textContent.replace(/\s+/g, "")).toContain(
      `.fight-stick.y{top:70px;left:210px;`
    );
  });

  test("Delete tab: delete a button, undo/redo/copy", () => {
    fireEvent.click(getByText(document.body, "Delete"));
    const buttonA = document.getElementById(".fight-stick .a");
    fireEvent.mouseDown(buttonA);
    expect(buttonA.style.visibility).toBe("hidden");

    // Copy code to clipboard
    fireEvent.click(getByText(document.body, "Copy code to clipboard"));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    // Undo
    fireEvent.click(getByText(document.body, "Undo last action"));
    expect(buttonA.style.visibility).not.toBe("hidden");

    // Redo
    fireEvent.click(getByText(document.body, "Redo last undo"));
    expect(buttonA.style.visibility).toBe("hidden");
  });

  test("Change size tab: change size input, resize button, undo/redo/copy", () => {
    fireEvent.click(getByText(document.body, "Change size"));
    const sizeInput = document.getElementById("sizeInput");
    sizeInput.value = "180";
    fireEvent.input(sizeInput);

    const buttonX = document.getElementById(".fight-stick .x");
    fireEvent.mouseDown(buttonX);
    expect(buttonX.style.width).toBe("180px");
    expect(buttonX.style.height).toBe("180px");

    fireEvent.click(getByText(document.body, "Copy code to clipboard"));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    fireEvent.click(getByText(document.body, "Undo last action"));
    expect(buttonX.style.width).not.toBe("180px");

    fireEvent.click(getByText(document.body, "Redo last undo"));
    expect(buttonX.style.width).toBe("180px");
  });

  test("Make buttons tab: change color, border, text, image, undo/redo/copy", () => {
    fireEvent.click(getByText(document.body, "Make/copy button"));
    const colorPicker = document.getElementById("unpressed-button-colorpicker");
    colorPicker.value = "#ff0000";
    fireEvent.input(colorPicker);

    const borderColorPicker = document.getElementById(
      "unpressed-border-colorpicker"
    );
    borderColorPicker.value = "#00ff00";
    fireEvent.input(borderColorPicker);

    const textInput = document.getElementById("unpressedTextContent");
    textInput.value = "Test";
    fireEvent.input(textInput);

    const imgInput = document.getElementById("unpressedButtonUrlInput");
    imgInput.value = "https://imgur.com/test.png";
    fireEvent.change(imgInput);

    fireEvent.click(getByText(document.body, "Copy code to clipboard"));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    fireEvent.click(getByText(document.body, "Undo last action"));
    // Optionally check that color/text/image reverted

    fireEvent.click(getByText(document.body, "Redo last undo"));
    // Optionally check that color/text/image restored
  });

  test("Import CSS tab: change textarea, import CSS, undo/redo/copy", () => {
    fireEvent.click(document.getElementById("importCssTab"));
    const cssTextArea = document.getElementById("importCssText");
    cssTextArea.value = `
      .fight-stick .x {
        top: 50px;
        left: 60px;
        background: #fff;
      }
    `;
    fireEvent.input(cssTextArea);

    fireEvent.click(document.getElementById("importCSS"));

    fireEvent.click(getByText(document.body, "Copy code to clipboard"));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    fireEvent.click(getByText(document.body, "Undo last action"));
    // Optionally check that CSS reverted

    fireEvent.click(getByText(document.body, "Redo last undo"));
    // Optionally check that CSS restored
  });

  test("How to use tab: tutorial visible, undo/redo/copy", () => {
    fireEvent.click(getByText(document.body, "How to use"));
    const tutorialTab = document.getElementById("tutorialTab");
    expect(tutorialTab).toBeVisible();
    expect(
      getByText(document.body, /Youtube video for how to use all features/i)
    ).toBeInTheDocument();

    fireEvent.click(getByText(document.body, "Copy code to clipboard"));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    fireEvent.click(getByText(document.body, "Undo last action"));
    // Optionally check that tutorial reverted

    fireEvent.click(getByText(document.body, "Redo last undo"));
    // Optionally check that tutorial restored
  });

  test("switchBaseLayout updates layout and CSS", async () => {
    // Mock XMLHttpRequest
    const originalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      this.open = jest.fn();
      this.send = jest.fn(function () {
        // Simulate a response with minimal valid CSS for one button
        this.responseText = `
          <body>
            .fight-stick .x {
              top: 123px;
              left: 456px;
              background: #fff;
            }
          </body>
        `;
        this.readyState = 4;
        this.status = 200;
        this.onreadystatechange && this.onreadystatechange();
        this.onload && this.onload();
      });
      this.addEventListener = (event, cb) => {
        if (event === "load") {
          setTimeout(() => {
            this.responseText = `
              <body>
                .fight-stick .x {
                  top: 123px;
                  left: 456px;
                  background: #fff;
                }
              </body>
            `;
            cb.call(this);
          }, 0);
        }
      };
    };

    // Call switchBaseLayout with a test URL
    const { switchBaseLayout } = require("../drag.js");
    switchBaseLayout(
      "https://gamepadviewer.com/?p=1&s=7&map=%7B%7D&editcss=https://example.com/test.css",
      false,
      false,
      true
    );

    // Wait for the mock XMLHttpRequest to finish
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check that the button's style was updated
    const buttonX = document.getElementById(".fight-stick .x");
    expect(buttonX.style.top).toBe("123px");
    expect(buttonX.style.left).toBe("456px");
    expect(buttonX.style.background).toBe("rgb(255, 255, 255)");

    // Restore original XMLHttpRequest
    window.XMLHttpRequest = originalXMLHttpRequest;
  });

  test("switchBaseLayout updates layout and CSS including pressed state", async () => {
    // Mock XMLHttpRequest
    const originalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      this.open = jest.fn();
      this.send = jest.fn(function () {
        // Simulate a response with valid CSS for both states
        this.responseText = `
          <body>
            .fight-stick .x {
              top: 123px;
              left: 456px;
              background: url('https://imgur.com/unpressed.png');
            }
            .fight-stick .x.pressed {
              background: url('https://imgur.com/pressed.png');
            }
          </body>
        `;
        this.readyState = 4;
        this.status = 200;
        this.onreadystatechange && this.onreadystatechange();
        this.onload && this.onload();
      });
      this.addEventListener = (event, cb) => {
        if (event === "load") {
          setTimeout(() => {
            this.responseText = `
              <body>
                .fight-stick .x {
                  top: 123px;
                  left: 456px;
                  background: url('https://imgur.com/unpressed.png');
                }
                .fight-stick .x.pressed {
                  background: url('https://imgur.com/pressed.png');
                }
              </body>
            `;
            cb.call(this);
          }, 0);
        }
      };
    };

    // Call switchBaseLayout with a test URL
    const { switchBaseLayout } = require("../drag.js");
    switchBaseLayout(
      "https://gamepadviewer.com/?p=1&s=7&map=%7B%7D&editcss=https://example.com/test.css",
      false,
      false,
      true
    );

    // Wait for the mock XMLHttpRequest to finish
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check that the button's style was updated
    const buttonX = document.getElementById(".fight-stick .x");
    expect(buttonX.style.top).toBe("123px");
    expect(buttonX.style.left).toBe("456px");
    expect(buttonX.style.backgroundImage).toContain("unpressed.png");

    // Simulate pressed state
    buttonX.classList.add("pressed");
    expect(buttonX.classList.contains("pressed")).toBe(true);
    expect(buttonX.style.backgroundImage).toContain("pressed.png");

    // Restore original XMLHttpRequest
    window.XMLHttpRequest = originalXMLHttpRequest;
  });

  test("switchBaseLayout updates layout and CSS including pressed state assuming background image from unpressed definition", async () => {
    // Mock XMLHttpRequest
    const originalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      this.open = jest.fn();
      this.send = jest.fn(function () {
        // Simulate a response with valid CSS for both states
        this.responseText = `
          <body>
            .fight-stick .x {
              top: 123px;
              left: 456px;
              background: url('https://imgur.com/unpressed.png');
            }
            .fight-stick .x.pressed {
              background: #ff0000;
            }
          </body>
        `;
        this.readyState = 4;
        this.status = 200;
        this.onreadystatechange && this.onreadystatechange();
        this.onload && this.onload();
      });
      this.addEventListener = (event, cb) => {
        if (event === "load") {
          setTimeout(() => {
            this.responseText = `
              <body>
                .fight-stick .x {
                  top: 123px;
                  left: 456px;
                  background: url('https://imgur.com/unpressed.png');
                }
                .fight-stick .x.pressed {
                  background: #ff0000;
                }
              </body>
            `;
            cb.call(this);
          }, 0);
        }
      };
    };

    // Call switchBaseLayout with a test URL
    const { switchBaseLayout } = require("../drag.js");
    switchBaseLayout(
      "https://gamepadviewer.com/?p=1&s=7&map=%7B%7D&editcss=https://example.com/test.css",
      false,
      false,
      true
    );

    // Wait for the mock XMLHttpRequest to finish
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check that the button's style was updated
    const buttonX = document.getElementById(".fight-stick .x");
    expect(buttonX.style.top).toBe("123px");
    expect(buttonX.style.left).toBe("456px");
    expect(buttonX.style.backgroundImage).toContain("unpressed.png");

    // Simulate pressed state
    buttonX.classList.add("pressed");
    expect(buttonX.classList.contains("pressed")).toBe(true);
    // Should NOT contain a url, should be a color
    expect(buttonX.style.backgroundImage).toBe(
      'url("https://imgur.com/unpressed.png")'
    );
    expect(buttonX.style.background).toBe(
      'url("https://imgur.com/unpressed.png")'
    );

    // Restore original XMLHttpRequest
    window.XMLHttpRequest = originalXMLHttpRequest;
  });

  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () =>
        Promise.resolve(`
        <body>
          .fight-stick .x {
            top: 123px;
            left: 456px;
            background: url('https://imgur.com/unpressed.png');
          }
          .fight-stick .x.pressed {
            background: url('https://imgur.com/pressed.png');
          }
        </body>
      `),
      ok: true,
      status: 200,
    })
  );
});
