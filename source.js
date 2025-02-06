var originalImg;
var mimicedImg;
var input;

const debug = false;

var newFrame = false;

let cropMaskRatios = [
  [16, 9],
  [9, 16],
  [20, 10],
  [10, 10],
  [36, 11],
  [27, 6],
  [8, 10],
];
let selectedRatioIndex = 0;
let maskScale = 1;

let maskScaleUpStop = false;
let maskScaleDownStop = false;

let zoomScale = 1;

let posX = 0; // Startposition X
let posY = 0; // Startposition Y

let frameWidth = 200;
let frameHeight = 100;

var dynFrameWidth = frameWidth;
var dynFrameHeight = frameHeight;

let imageLoading = true;

var defaulCanvasWidth = 1200;
var canvasWidth;

var limitExport = true;
var imageName = 'Scaled Image.jpg';
var croppedImage;

var frameBorderThickness = 5;
var newFrameBorderThickness = 2;

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB in Bytes
const QUALITY = 0.8; // JPEG-Qualität

var moveGrab = false;
var moveGrabState = {
  mOffX: 0,
  mOffY: 0,
  factorOffX: 0,
  factorOffY: 0,
};

var resizeGrab = false;
var resizeGrabState = {
  state: 'none',
  mPosX: 0,
  mPosY: 0,
  mOffX: 0,
  mOffY: 0,
  posX: 0,
  posY: 0,
  frameWidth: 0,
  frameHeight: 0,
};

var minFrameSize = 100;

function preload() {}

function setup() {
  var canvas = createCanvas(0, 0);
  canvas.parent('sketch-holder');

  input = createFileInput(handleImage);
  input.elt.style.display = 'none';

  document.getElementById('zoomScaleAdd').disabled = true;
  document.getElementById('zoomScaleRemove').disabled = true;
  document.getElementById('filedownload').disabled = true;
  document.querySelectorAll('.mdc-radio__native-control').forEach((radio) => (radio.disabled = true));
  document.querySelectorAll('.mdc-checkbox__native-control').forEach((radio) => (radio.disabled = true));

  updateOverallScale();
  changeMask(0);
}

const openInput = () => {
  input.elt.click();
};

function draw() {
  background(color('#f5f0f0'));

  scale(0.5);

  // Draw the image if loaded.
  if (originalImg && !imageLoading) {
    mimicedImg = originalImg;

    resizeCanvas(canvasWidth, Math.round((mimicedImg.height / mimicedImg.width) * canvasWidth));
    image(mimicedImg, 0, 0, 1 * width, (1 * mimicedImg.height * width) / mimicedImg.width);

    drawSelectionFrame(posX, posY, width, height, dynFrameWidth, dynFrameHeight, frameBorderThickness);
    changeCursor(posX, posY, dynFrameWidth, dynFrameHeight, frameBorderThickness);

    if (moveGrab) {
      if (debug) text(moveGrab + ' | ' + JSON.stringify(moveGrabState), 5, 45);
      translateFrameTo(mouseX - (moveGrabState.mOffX + moveGrabState.factorOffX), mouseY - (moveGrabState.mOffY + moveGrabState.factorOffY));
      cursor('grab');
    } else if (resizeGrab) {
      switch (resizeGrabState.state) {
        case 'topleft': {
          cursor('nwse-resize');

          const { newWidth, newHeight } = calcNewDim(true, resizeGrabState.mPosX, resizeGrabState.frameWidth);
          translateFrameTo(resizeGrabState.posX - (newWidth - resizeGrabState.frameWidth), resizeGrabState.posY - (newHeight - resizeGrabState.frameHeight));
          resizeFrameToValue(newWidth, newHeight);

          break;
        }
        case 'topright': {
          cursor('nesw-resize');

          const { newWidth, newHeight } = calcNewDim(true, resizeGrabState.mPosX, resizeGrabState.frameWidth, true);
          translateFrameTo(resizeGrabState.posX, resizeGrabState.posY - (newHeight - resizeGrabState.frameHeight));
          resizeFrameToValue(newWidth, newHeight);

          break;
        }
        case 'bottomleft': {
          cursor('nesw-resize');

          const { newWidth, newHeight } = calcNewDim(true, resizeGrabState.mPosX, resizeGrabState.frameWidth);
          translateFrameTo(resizeGrabState.posX - (newWidth - resizeGrabState.frameWidth), resizeGrabState.posY);
          resizeFrameToValue(newWidth, newHeight);

          break;
        }
        case 'bottomright': {
          cursor('nwse-resize');

          const { newWidth, newHeight } = calcNewDim(true, resizeGrabState.mPosX, resizeGrabState.frameWidth, true);
          translateFrameTo(resizeGrabState.posX, resizeGrabState.posY);
          resizeFrameToValue(newWidth, newHeight);

          break;
        }
        case 'top': {
          cursor('ns-resize');

          const { newWidth, newHeight } = calcNewDim(false, resizeGrabState.mPosY, resizeGrabState.frameHeight);
          translateFrameTo(resizeGrabState.posX, resizeGrabState.posY - (newHeight - resizeGrabState.frameHeight));
          resizeFrameToValue(newWidth, newHeight);

          break;
        }
        case 'bottom': {
          cursor('ns-resize');

          const { newWidth, newHeight } = calcNewDim(false, resizeGrabState.mPosY, resizeGrabState.frameHeight, true);
          translateFrameTo(resizeGrabState.posX, resizeGrabState.posY);
          resizeFrameToValue(newWidth, newHeight);

          break;
        }
        case 'left': {
          cursor('ew-resize');

          const { newWidth, newHeight } = calcNewDim(true, resizeGrabState.mPosX, resizeGrabState.frameWidth);
          translateFrameTo(resizeGrabState.posX - (newWidth - resizeGrabState.frameWidth), resizeGrabState.posY);
          resizeFrameToValue(newWidth, newHeight);

          break;
        }
        case 'right': {
          cursor('ew-resize');

          const { newWidth, newHeight } = calcNewDim(true, resizeGrabState.mPosX, resizeGrabState.frameWidth, true);
          translateFrameTo(resizeGrabState.posX, resizeGrabState.posY);
          resizeFrameToValue(newWidth, newHeight);

          break;
        }
        default: {
          cursor('default');
          break;
        }
      }
    }

    if (debug) text('mX: ' + Math.round(mouseX * 100) / 100 + ' mY: ' + Math.round(mouseY * 100) / 100 + ' | pX: ' + posX + ' pY: ' + posY + ' | frameW: ' + dynFrameWidth + ' frameH: ' + dynFrameHeight, 5, 15);
    if (debug) text(resizeGrab + ' | ' + JSON.stringify(resizeGrabState), 5, 30);
  }
}

const drawSelectionFrame = (posX, posY, width, height, frameWidth, frameHeight, frameBorderThickness) => {
  // Draw the selection frame over the image
  noStroke();
  fill(50, 50, 50, 210); // Dark gray with transparency
  rect(0, 0, width, posY); // Top Area
  rect(0, posY, posX, frameHeight); // Left Area
  rect(posX + frameWidth, posY, width - (posX + frameWidth), frameHeight); // Right Area
  rect(0, posY + frameHeight, width, height - (posY + frameHeight)); // Bottom Area

  if (newFrame) {
    fill(color('#ffffff')); // Frame Primary Color
    stroke(color('#cb99c9'));
    strokeWeight(3);
    circle(posX, posY, newFrameBorderThickness * 5); // top left
    circle(posX + frameWidth, posY, newFrameBorderThickness * 5); // top right
    circle(posX, posY + frameHeight, newFrameBorderThickness * 5); // bottom left
    circle(posX + frameWidth, posY + frameHeight, newFrameBorderThickness * 5); // bottom right

    rect(posX + frameWidth / 2 - (newFrameBorderThickness * 15) / 2, posY - (newFrameBorderThickness * 3) / 2, newFrameBorderThickness * 15, newFrameBorderThickness * 3); // top
    rect(posX + frameWidth / 2 - (newFrameBorderThickness * 15) / 2, posY + frameHeight - (newFrameBorderThickness * 3) / 2, newFrameBorderThickness * 15, newFrameBorderThickness * 3); // bottom

    rect(posX - (newFrameBorderThickness * 3) / 2, posY + frameHeight / 2 - (newFrameBorderThickness * 15) / 2, newFrameBorderThickness * 3, newFrameBorderThickness * 15); // left
    rect(posX + frameWidth - (newFrameBorderThickness * 3) / 2, posY + frameHeight / 2 - (newFrameBorderThickness * 15) / 2, newFrameBorderThickness * 3, newFrameBorderThickness * 15); // left
  } else {
    fill(color('#cb99c9')); // Frame Primary Color
    rect(posX, posY - frameBorderThickness, frameWidth, frameBorderThickness); // Top
    rect(posX, posY + frameHeight, frameWidth, frameBorderThickness); // Bottom
    rect(posX - frameBorderThickness, posY - frameBorderThickness, frameBorderThickness, frameHeight + frameBorderThickness * 2); // Left
    rect(posX + frameWidth, posY - frameBorderThickness, frameBorderThickness, frameHeight + frameBorderThickness * 2); // Right
  }
};

const changeCursor = (posX, posY, frameWidth, frameHeight, frameBorderThickness) => {
  cursor('default');

  if (newFrame) {
    if (mouseX > posX && mouseX < posX + frameWidth && mouseY > posY && mouseY < posY + frameHeight) {
      cursor('grab');
    } else if (mouseX > posX && mouseX < posX + frameWidth) {
      if (mouseY > posY - frameBorderThickness && mouseY < posY) {
        cursor('ns-resize'); // Top
      } else if (mouseY > posY + frameHeight && mouseY < posY + frameHeight + frameBorderThickness) {
        cursor('ns-resize'); // Bottom
      }
    } else if (mouseY > posY && mouseY < posY + frameHeight) {
      if (mouseX > posX - frameBorderThickness && mouseX < posX) {
        cursor('ew-resize'); // Left
      } else if (mouseX > posX + frameWidth && mouseX < posX + frameWidth + frameBorderThickness) {
        cursor('ew-resize'); // Right
      }
    } else {
      if (mouseY > posY - frameBorderThickness && mouseY < posY && mouseX > posX - frameBorderThickness && mouseX < posX) {
        cursor('nwse-resize'); // Top Left
      } else if (mouseY > posY - frameBorderThickness && mouseY < posY && mouseX > posX + frameWidth && mouseX < posX + frameWidth + frameBorderThickness) {
        cursor('nesw-resize'); // Top Right
      } else if (mouseY > posY + frameHeight && mouseY < posY + frameHeight + frameBorderThickness && mouseX > posX - frameBorderThickness && mouseX < posX) {
        cursor('nesw-resize'); // Bottom Left
      } else if (mouseY > posY + frameHeight && mouseY < posY + frameHeight + frameBorderThickness && mouseX > posX + frameWidth && mouseX < posX + frameWidth + frameBorderThickness) {
        cursor('nwse-resize'); // Bottom Right
      }
    }
  } else {
    if (mouseX > posX && mouseX < posX + frameWidth && mouseY > posY && mouseY < posY + frameHeight) {
      cursor('grab');
    } else if (mouseX > posX && mouseX < posX + frameWidth) {
      if (mouseY > posY - frameBorderThickness && mouseY < posY) {
        cursor('ns-resize'); // Top
      } else if (mouseY > posY + frameHeight && mouseY < posY + frameHeight + frameBorderThickness) {
        cursor('ns-resize'); // Bottom
      }
    } else if (mouseY > posY && mouseY < posY + frameHeight) {
      if (mouseX > posX - frameBorderThickness && mouseX < posX) {
        cursor('ew-resize'); // Left
      } else if (mouseX > posX + frameWidth && mouseX < posX + frameWidth + frameBorderThickness) {
        cursor('ew-resize'); // Right
      }
    } else {
      if (mouseY > posY - frameBorderThickness && mouseY < posY && mouseX > posX - frameBorderThickness && mouseX < posX) {
        cursor('nwse-resize'); // Top Left
      } else if (mouseY > posY - frameBorderThickness && mouseY < posY && mouseX > posX + frameWidth && mouseX < posX + frameWidth + frameBorderThickness) {
        cursor('nesw-resize'); // Top Right
      } else if (mouseY > posY + frameHeight && mouseY < posY + frameHeight + frameBorderThickness && mouseX > posX - frameBorderThickness && mouseX < posX) {
        cursor('nesw-resize'); // Bottom Left
      } else if (mouseY > posY + frameHeight && mouseY < posY + frameHeight + frameBorderThickness && mouseX > posX + frameWidth && mouseX < posX + frameWidth + frameBorderThickness) {
        cursor('nwse-resize'); // Bottom Right
      }
    }
  }
};

const updateOverallScale = () => {
  let oldCavnasWidth = canvasWidth;
  canvasWidth = Math.round((windowWidth / 1920) * defaulCanvasWidth * zoomScale);

  if (mimicedImg) {
    posX = Math.round((posX / oldCavnasWidth) * canvasWidth);
    posY = Math.round((posY / oldCavnasWidth) * canvasWidth);

    frameWidth = Math.round((dynFrameWidth = (frameWidth / oldCavnasWidth) * canvasWidth));
    frameHeight = Math.round((dynFrameHeight = (frameHeight / oldCavnasWidth) * canvasWidth));
  }

  //posX = (posX / oldCavnasWidth) * canvasWidth;

  //if (mimicedImg) posY = (posY / ((mimicedImg.height / mimicedImg.width) * oldCavnasWidth)) * ((mimicedImg.height / mimicedImg.width) * canvasWidth);

  // change mask size on window resize
};

const setOverallScale = (relativeScalefactor) => {
  if (relativeScalefactor > 0) {
    document.getElementById('zoomScaleAdd').disabled = zoomScale > 1.0;
    document.getElementById('zoomScaleRemove').disabled = false;

    if (zoomScale < 1.2) {
      zoomScale += relativeScalefactor;
      updateOverallScale();
    }
  } else {
    document.getElementById('zoomScaleRemove').disabled = zoomScale < 0.7;
    document.getElementById('zoomScaleAdd').disabled = false;

    if (zoomScale > 0.5) {
      zoomScale += relativeScalefactor;
      updateOverallScale();
    }
  }

  document.getElementById('zoomScaleLabel').innerHTML = `${Math.round(zoomScale * 100)}%`;
};

function windowResized() {
  updateOverallScale();
}

function mousePressed() {
  if (mouseX > posX && mouseX < posX + dynFrameWidth && mouseY > posY && mouseY < posY + dynFrameHeight) {
    moveGrab = true;
    moveGrabState = { mOffX: mouseX - posX, mOffY: mouseY - posY, factorOffX: 0, factorOffY: 0 };
  } else if (mouseX > posX && mouseX < posX + dynFrameWidth) {
    if (mouseY > posY - frameBorderThickness && mouseY < posY) {
      setResizeGrab('top', mouseX, mouseY);
    } else if (mouseY > posY + dynFrameHeight && mouseY < posY + dynFrameHeight + frameBorderThickness) {
      setResizeGrab('bottom', mouseX, mouseY);
    }
  } else if (mouseY > posY && mouseY < posY + dynFrameHeight) {
    if (mouseX > posX - frameBorderThickness && mouseX < posX) {
      setResizeGrab('left', mouseX, mouseY);
    } else if (mouseX > posX + dynFrameWidth && mouseX < posX + dynFrameWidth + frameBorderThickness) {
      setResizeGrab('right', mouseX, mouseY);
    }
  } else {
    if (mouseY > posY - frameBorderThickness && mouseY < posY && mouseX > posX - frameBorderThickness && mouseX < posX) {
      setResizeGrab('topleft', mouseX, mouseY);
    } else if (mouseY > posY - frameBorderThickness && mouseY < posY && mouseX > posX + dynFrameWidth && mouseX < posX + dynFrameWidth + frameBorderThickness) {
      setResizeGrab('topright', mouseX, mouseY);
    } else if (mouseY > posY + dynFrameHeight && mouseX > posX - frameBorderThickness && mouseX < posX) {
      setResizeGrab('bottomleft', mouseX, mouseY);
    } else if (mouseY > posY + dynFrameHeight && mouseX > posX + dynFrameWidth && mouseX < posX + dynFrameWidth + frameBorderThickness) {
      setResizeGrab('bottomright', mouseX, mouseY);
    }
  }
}

function mouseReleased() {
  moveGrab = false;
  moveGrabState = {
    mOffX: 0,
    mOffY: 0,
    factorOffX: 0,
    factorOffY: 0,
  };

  resizeGrab = false;
  resizeGrabState = { state: '', mPosX: 0, mPosY: 0, mOffX: 0, mOffY: 0, posX: 0, posY: 0, frameWidth: 0, frameHeight: 0 };

  frameWidth = dynFrameWidth;
  frameHeight = dynFrameHeight;
}

function mouseWheel(event) {
  if (originalImg) {
    if (mouseX > 0 && mouseX <= canvasWidth && mouseY > 0 && mouseY <= (originalImg.height / originalImg.width) * canvasWidth) {
      if (event.delta < 0) {
        if (maskScaleDownStop) return;
        maskScale -= 0.05;
      } else {
        if (maskScaleUpStop) return;
        maskScale += 0.05;
      }

      var oldWidth = dynFrameWidth;
      var oldHeight = dynFrameHeight;
      resizeFrameByFactor(maskScale);

      if (moveGrab) {
        moveGrabState = { ...moveGrabState, factorOffX: moveGrabState.factorOffX + (dynFrameWidth - oldWidth) / 2, factorOffY: moveGrabState.factorOffY + (dynFrameHeight - oldHeight) / 2 };
      } else {
        translateFrameTo(posX - (dynFrameWidth - oldWidth) / 2, posY - (dynFrameHeight - oldHeight) / 2);
      }

      if (debug) console.log(maskScale);
      maskScale = 1;

      return false;
    }
  }
}

function handleImage(file) {
  console.log(file);

  if (file.type === 'image') {
    imageLoading = true;

    imageName = file.name.replace('.jpeg', '').replace('.png', '').replace('.jpg', '') + ' - Skaliert.jpg';

    document.getElementById('zoomScaleAdd').disabled = true;
    document.getElementById('zoomScaleRemove').disabled = true;
    document.getElementById('filedownload').disabled = true;
    document.querySelectorAll('.mdc-radio__native-control').forEach((radio) => (radio.disabled = true));
    document.querySelectorAll('.mdc-checkbox__native-control').forEach((radio) => (radio.disabled = true));

    originalImg = loadImage(file.data, () => handleImageLoaded());
  } else {
    originalImg = null;
  }
}

function handleImageLoaded() {
  imageLoading = false;

  document.getElementById('zoomScaleAdd').disabled = false;
  document.getElementById('zoomScaleRemove').disabled = false;
  document.getElementById('filedownload').disabled = false;
  document.querySelectorAll('.mdc-radio__native-control').forEach((radio) => (radio.disabled = false));
  document.querySelectorAll('.mdc-checkbox__native-control').forEach((radio) => (radio.disabled = false));

  maskScale = 1;
  dynFrameWidth = frameWidth = minFrameSize;
  dynFrameHeight = frameHeight = Math.round((minFrameSize / getCurrRatio(0)) * getCurrRatio(1));
  posX = Math.round(canvasWidth / 2 - frameWidth / 2);
  posY = Math.round(((originalImg.height / originalImg.width) * canvasWidth) / 2 - frameHeight / 2);
}

const downloadFile = () => {
  let currentBlob;

  var factor = originalImg.width / canvasWidth;
  croppedImage = originalImg.get(posX * factor, posY * factor, dynFrameWidth * factor, dynFrameHeight * factor);

  if (limitExport) {
    for (var i = 0; i <= 5; i++) {
      console.log('Iteration Count: ' + i);

      const dataUrl = croppedImage.canvas.toDataURL('image/jpeg', QUALITY);
      currentBlob = dataURItoBlob(dataUrl);
      console.log(`Blob-Größe: ${currentBlob.size} Bytes`);

      if (currentBlob.size > MAX_FILE_SIZE) {
        resizeImage(currentBlob.size, croppedImage);
      } else {
        console.log('Finished');
        console.log(currentBlob.size);
        break;
      }
    }
  } else {
    const dataUrl = croppedImage.canvas.toDataURL('image/jpeg', QUALITY);
    currentBlob = dataURItoBlob(dataUrl);
    console.log(`Blob-Größe: ${currentBlob.size} Bytes`);
  }

  saveBlob(currentBlob, imageName);

  console.log('Bild finalisiert!');
};

function changeMask(index) {
  maskScaleUpStop = false;
  maskScaleDownStop = false;
  selectedRatioIndex = index;
  maskScale = 1;

  dynFrameWidth = frameWidth = minFrameSize * maskScale;
  dynFrameHeight = frameHeight = Math.round((minFrameSize / getCurrRatio(0)) * getCurrRatio(1) * maskScale);

  posX = Math.round(width / 2 - frameWidth / 2);
  posY = Math.round(height / 2 - frameHeight / 2);
}

const getCurrRatio = (index) => cropMaskRatios[selectedRatioIndex][index];

const resizeImage = (fileSize, img) => {
  let scaleFactor = Math.sqrt(MAX_FILE_SIZE / fileSize);
  let effectiveScaleFactor = scaleFactor * Math.sqrt(1);

  const newWidth = Math.floor(img.width * effectiveScaleFactor);
  const newHeight = Math.floor(img.height * effectiveScaleFactor);

  console.log(`Originalgröße: ${img.width}x${img.height}`);
  console.log(`Skalierte Größe: ${newWidth}x${newHeight} (Skalierungsfaktor: ${effectiveScaleFactor.toFixed(4)})`);

  img.resize(newWidth, newHeight);

  return { newWidth, newHeight };
};

const dataURItoBlob = (dataURI) => {
  var byteString = atob(dataURI.split(',')[1]);
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  var blob = new Blob([ab], { type: mimeString });
  return blob;
};

const saveBlob = (blob, fileName) => {
  var a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';

  var url = URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

const toggleExportSize = (val) => {
  limitExport = val.checked;
};

const setResizeGrab = (state, mPosX, mPosY) => {
  resizeGrab = true;
  resizeGrabState = { state, mPosX: Math.round(mPosX), mPosY: Math.round(mPosY), mOffX: Math.round(mPosX - posX), mOffY: Math.round(mPosY) - posY, posX, posY, frameWidth, frameHeight };
};

const translateFrameTo = (newPosX, newPosY) => {
  posX = Math.round(constrain(newPosX, 0, width - dynFrameWidth));
  posY = Math.round(constrain(newPosY, 0, height - dynFrameHeight));
};

const translateFrameBy = (diffX, diffY) => {
  posX = Math.round(constrain(posX + diffX, 0, width - dynFrameWidth));
  posY = Math.round(constrain(posY + diffY, 0, height - dynFrameHeight));
};

const resizeFrameByFactor = (factor) => {
  if (frameWidth * factor > width) {
    frameWidth = dynFrameWidth = width;
    frameHeight = dynFrameHeight = Math.round((frameWidth / getCurrRatio(0)) * getCurrRatio(1));

    maskScaleUpStop = true;
  } else if (frameHeight * factor > height) {
    frameHeight = dynFrameHeight = height;
    frameWidth = dynFrameWidth = Math.round((frameHeight * getCurrRatio(0)) / getCurrRatio(1));

    maskScaleUpStop = true;
  } else if (frameWidth * factor < minFrameSize) {
    frameWidth = dynFrameWidth = minFrameSize;
    frameHeight = dynFrameHeight = Math.round((minFrameSize / getCurrRatio(0)) * getCurrRatio(1));

    maskScaleDownStop = true;
  } else if (frameHeight * factor < (minFrameSize / getCurrRatio(0)) * getCurrRatio(1)) {
    frameHeight = dynFrameHeight = Math.round((minFrameSize / getCurrRatio(0)) * getCurrRatio(1));
    frameWidth = dynFrameWidth = minFrameSize;

    maskScaleDownStop = true;
  } else {
    frameWidth = dynFrameWidth = Math.round(frameWidth * factor);
    frameHeight = dynFrameHeight = Math.round(frameHeight * factor);

    maskScaleUpStop = false;
    maskScaleDownStop = false;
  }
};

const resizeFrameByValue = (valX, valY) => {
  dynFrameWidth = frameWidth + valX;
  dynFrameHeight = frameHeight + valY;
};

const resizeFrameToValue = (valX, valY) => {
  if (valX > width) {
    dynFrameWidth = frameWidth = width;
    dynFrameHeight = frameHeight = Math.round((width / getCurrRatio(0)) * getCurrRatio(1));
  } else if (valY > height) {
    dynFrameHeight = frameHeight = height;
    dynFrameWidth = frameWidth = Math.round((height * getCurrRatio(0)) / getCurrRatio(1));
  } else {
    dynFrameWidth = valX;
    dynFrameHeight = valY;
  }

  maskScaleUpStop = maskScaleDownStop = false;
};

const calcNewDim = (primaryX, refMPos, refSize, inverted = false) => {
  if (primaryX) {
    var newWidth = Math.round(max(refSize + (refMPos - mouseX) * (inverted ? -1 : 1), minFrameSize));
    var newHeight = Math.round(max((newWidth / getCurrRatio(0)) * getCurrRatio(1), (minFrameSize / getCurrRatio(0)) * getCurrRatio(1)));
  } else {
    var newHeight = Math.round(max(refSize + (refMPos - mouseY) * (inverted ? -1 : 1), (minFrameSize / getCurrRatio(0)) * getCurrRatio(1)));
    var newWidth = Math.round(max((newHeight * getCurrRatio(0)) / getCurrRatio(1), minFrameSize));
  }

  return { newWidth, newHeight };
};

function keyPressed() {
  if (keyIsDown(17) && keyIsDown(18) && keyCode === 70) {
    newFrame = !newFrame;
  }
}
