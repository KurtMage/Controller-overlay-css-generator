/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");
const {
  fireEvent,
  getByText,
  getByLabelText,
  getByRole,
} = require("@testing-library/dom");
require("@testing-library/jest-dom");

const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
const { highlightButton, clickAction, init } = require("../drag.js");

describe("Controller Overlay CSS Generator UI", () => {
  beforeEach(() => {
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
});
