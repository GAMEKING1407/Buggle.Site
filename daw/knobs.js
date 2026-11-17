document.querySelectorAll(".knob").forEach((knob) => {
  const input = knob.querySelector('input[type="range"]');
  const dial = knob.querySelector(".knob-dial");
  const valueDisplay = knob.parentElement.querySelector(".knob-value");
  const unit = knob.dataset.unit || "";

  const min = parseFloat(input.min);
  const max = parseFloat(input.max);
  const step = parseFloat(input.step) || 1;
  const defaultValue = parseFloat(input.value);

  function updateVisuals(val) {
    const percent = (val - min) / (max - min);
    const angle = -135 + percent * 270;
    dial.style.setProperty("--angle", `${angle}deg`);

    if (valueDisplay) {
      if (unit === "%") {
        valueDisplay.textContent = `${Math.round(percent * 100)}%`;
      } else {
        valueDisplay.textContent = `${val} ${unit}`.trim();
      }
    }
  }

  updateVisuals(defaultValue);

  let startY = 0;
  let startVal = 0;

  knob.addEventListener("pointerdown", (e) => {
    knob.setPointerCapture(e.pointerId);
    startY = e.clientY;
    startVal = parseFloat(input.value);
  });

  knob.addEventListener("pointermove", (e) => {
    if (!knob.hasPointerCapture(e.pointerId)) return;

    const sensitivity = e.shiftKey ? 600 : 150;
    const deltaY = startY - e.clientY;
    const deltaVal = (deltaY / sensitivity) * (max - min);

    let newVal = Math.min(max, Math.max(min, startVal + deltaVal));

    newVal = Math.round(newVal / step) * step;
    newVal = Number(newVal.toFixed(4));

    if (newVal !== parseFloat(input.value)) {
      input.value = newVal;
      updateVisuals(newVal);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  knob.addEventListener("dblclick", () => {
    input.value = defaultValue;
    updateVisuals(defaultValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
});

