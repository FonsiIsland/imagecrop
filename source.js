var originalImg;
var mimicedImg;
var input;

// https://codepen.io/DanielHarty/details/vRRxxL

let cropMaskRatios = [[16,9],[20,10],[10,10],[36,11],[27,6]]
let selectedRatioIndex = 0;
let maskScale = 1;
let maskScaleStop = false;
let resizeFactor = 1;

let zoomScale = 1;

let posX = 200; // Startposition X
let posY = 200; // Startposition Y
let rectWidth = 10;
let rectHeight = 10;
let move = false;
let offsetX = 0;
let offsetY = 0;

let imageLoading = true;

var defaulCanvasWidth = 1200;
var canvasWidth;

var limitExport = true;
var imageName = "Scaled Image.jpg";
var croppedImage;

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB in Bytes
const QUALITY = 0.8; // JPEG-Qualität


//height of our horizontal slice
var sliceHeight = 10;

//the maximum x-offset we will apply to each slice
var offsetMax = 20;

function preload() {
  //img = loadImage('cat.jpg');
}

function setup() {
    var canvas = createCanvas(0, 0);
    canvas.parent('sketch-holder');
    
    input = createFileInput(handleImage);
    input.elt.style.display='none';
 
    //input = document.createElement('input');
    //input.type = 'file';
    //input.style.display='none';
    
    // input.onchange = e => { 
    //    var file = e.target.files[0]; 
    //    handleImage(file);
    // }

    document.getElementById("zoomScaleAdd").disabled = true;
    document.getElementById("zoomScaleRemove").disabled = true;
    document.getElementById("filedownload").disabled = true;
    document.querySelectorAll('.mdc-radio__native-control').forEach((radio) => radio.disabled = true);
    document.querySelectorAll('.mdc-checkbox__native-control').forEach((radio) => radio.disabled = true);

    //let croped = img.get(100, 100, img.width-100, img.height-100);
    //image(croped, 100,100);  

    updateOverallScale();

}

const openInput = () => {
  input.elt.click();
}

function draw() {
  background(color('#f5f0f0'));

  scale(0.5);

  // Draw the image if loaded.
  if (originalImg && !imageLoading) {

    mimicedImg = originalImg;
    

    //if(mimicedImg.width > canvasWidth){
      //resizeCanvas(img.width,img.height)
        resizeCanvas(canvasWidth, mimicedImg.height / mimicedImg.width * canvasWidth);
        //image(img, 0, 0, img.width, img.height);

        image(mimicedImg, 0, 0, 1*width, 1 *mimicedImg.height*width/mimicedImg.width); 

        //img.resize(1000, 0);
    //}


    
    rectWidth = 10* cropMaskRatios[selectedRatioIndex][0] * Math.round((zoomScale*maskScale) *100)/100;
    rectHeight = 10*cropMaskRatios[selectedRatioIndex][1] * Math.round((zoomScale*maskScale) *100)/100;

    
    if(rectWidth >= width) {
      rectWidth = width;
      rectHeight = rectWidth / cropMaskRatios[selectedRatioIndex][0] * cropMaskRatios[selectedRatioIndex][1];

      maskScaleStop = true;
    }

    if(rectHeight >= height) {
      rectHeight = height;
      rectWidth = rectHeight / cropMaskRatios[selectedRatioIndex][1] * cropMaskRatios[selectedRatioIndex][0];

      maskScaleStop = true;
    }

    if(rectWidth < width && rectHeight < height)
      maskScaleStop = false;


       // Koordinaten des sichtbaren Rechtecks
    let rectX = Math.round(posX-(rectWidth/2)) // X-Position des Rechtecks
    let rectY = Math.round(posY-(rectHeight/2)) // Y-Position des Rechtecks
   
    //console.log("x: " + rectX + " y: " +rectY + " | w: " + rectWidth +" h: " + rectHeight)

    // Zeichne das graue Overlay, aber spare das Rechteck aus
    noStroke();
    fill(50, 50, 50, 200); // Dunkelgrau mit Transparenz
    rect(0, 0, width, rectY); // Oberhalb des sichtbaren Bereichs
    rect(0, rectY, rectX, rectHeight); // Links vom sichtbaren Bereich
    rect(rectX + rectWidth, rectY, width - (rectX + rectWidth), rectHeight); // Rechts vom sichtbaren Bereich
    rect(0, rectY + rectHeight, width, height - (rectY + rectHeight)); // Unterhalb des sichtbaren Bereichs

    fill(color('#cb99c9')); // Dunkelgrau mit Transparenz
    rect(rectX, rectY-2, rectWidth, 2); // Oben
    rect(rectX, rectY+rectHeight, rectWidth, 2); // Unten
    
    rect(rectX-2, rectY-2, 2, rectHeight + 4); // Links
    rect(rectX+rectWidth, rectY-2, 2, rectHeight +4); // Rechts

    
    cursor('default')

    if(mouseX > rectX && mouseX < rectX+rectWidth && mouseY > rectY && mouseY < rectY+rectHeight) {
      cursor('grab')
    }else if(mouseX > rectX && mouseX < rectX+rectWidth) {
      if(mouseY > rectY-2 && mouseY < rectY){
        cursor('row-resize');
      }else if(mouseY > rectY+rectHeight && mouseY < rectY+rectHeight+2){
        cursor('row-resize');
      }
    }else if(mouseY > rectY && mouseY < rectY+rectHeight) {
      if(mouseX > rectX-2 && mouseX < rectX){
        cursor('col-resize');
      }else if(mouseX > rectX+rectWidth && mouseX < rectX+rectWidth+2){
        cursor('col-resize');
      }
    }

    if (move) {
    
      // Grenzen festlegen, damit das Rechteck nicht aus dem Canvas herausgeschoben wird
      posX = constrain(mouseX - offsetX, (rectWidth/2), width - (rectWidth/2)); // Begrenzung auf Canvas-Breite
      posY = constrain(mouseY - offsetY, (rectHeight/2), height - (rectHeight/2)); // Begrenzung auf Canvas-Höhe
    }else{
      posX = constrain(posX, (rectWidth/2), width - (rectWidth/2)); // Begrenzung auf Canvas-Breite
      posY = constrain(posY, (rectHeight/2), height - (rectHeight/2)); // Begrenzung auf Canvas-Höhe
    }
  }
}

const updateOverallScale = () => { 
  let oldCavnasWidth = canvasWidth;
  canvasWidth = (windowWidth / 1920 * defaulCanvasWidth)*zoomScale;

  posX = posX / oldCavnasWidth * canvasWidth;

  if(mimicedImg)
    posY = posY / (mimicedImg.height / mimicedImg.width * oldCavnasWidth) * (mimicedImg.height / mimicedImg.width * canvasWidth);


  // change mask size on window resize

}

const setOverallScale = (relativeScalefactor) => {
  if(relativeScalefactor > 0) {
    document.getElementById("zoomScaleAdd").disabled = zoomScale > 1.0;
    document.getElementById("zoomScaleRemove").disabled = false;

    if(zoomScale < 1.2) {
      zoomScale += relativeScalefactor;
      updateOverallScale();
    }
  }else {
    document.getElementById("zoomScaleRemove").disabled = zoomScale < 0.7;
    document.getElementById("zoomScaleAdd").disabled = false;

    if(zoomScale > 0.5) {
      zoomScale += relativeScalefactor;
      updateOverallScale();
    }
  }

  document.getElementById('zoomScaleLabel').innerHTML = `${Math.round(zoomScale*100)}%`
}

function windowResized() {
  updateOverallScale();
}

function mousePressed() {
  if (
    mouseX > posX - rectWidth / 2 &&
    mouseX < posX + rectWidth / 2 &&
    mouseY > posY - rectHeight / 2 &&
    mouseY < posY + rectHeight / 2
  ) {
    move = true;

    offsetX = mouseX - posX;
    offsetY = mouseY - posY;
  }
}


function mouseReleased() {
  move = false;
}

function mouseWheel(event) {
  if (originalImg) {
    if(mouseX > 0 && mouseX <= canvasWidth && mouseY > 0 && mouseY <= (originalImg.height / originalImg.width * canvasWidth)){
      if (event.delta < 0) {
        if(maskScale > 1.0)
          maskScale -= 0.05;
      } else {
        if(maskScaleStop) return;
    
        if(maskScale < 8)
          maskScale += 0.05;
      }
    
      console.log(maskScale);

      return false;
    }  
  }
}

function handleImage(file) {
console.log(file)

  if (file.type === 'image') {
    imageLoading = true;

    imageName = file.name.replace(".jpeg", "").replace(".png","").replace(".jpg", "") + " - Skaliert.jpg";

    document.getElementById("zoomScaleAdd").disabled = true;
    document.getElementById("zoomScaleRemove").disabled = true;
    document.getElementById("filedownload").disabled = true;
    document.querySelectorAll('.mdc-radio__native-control').forEach((radio) => radio.disabled = true);
    document.querySelectorAll('.mdc-checkbox__native-control').forEach((radio) => radio.disabled = true);

    originalImg = loadImage(file.data, () => handleImageLoaded());
  } else {
    originalImg = null;
  }
}

function changeMask(index) {
  selectedRatioIndex = index;
  maskScale = 1;
}

function handleImageLoaded() {
  imageLoading = false;

  document.getElementById("zoomScaleAdd").disabled = false;
  document.getElementById("zoomScaleRemove").disabled = false;
  document.getElementById("filedownload").disabled = false;
  document.querySelectorAll('.mdc-radio__native-control').forEach((radio) => radio.disabled = false);
  document.querySelectorAll('.mdc-checkbox__native-control').forEach((radio) => radio.disabled = false);

  posX = canvasWidth/2
  posY = (originalImg.height / originalImg.width * canvasWidth)/2
  maskScale = 1
}

const downloadFile = () => {
  let currentBlob;
    
  var factor = originalImg.width/canvasWidth;
  croppedImage = originalImg.get((posX - rectWidth / 2)*factor, (posY - rectHeight / 2)*factor, rectWidth*factor, rectHeight*factor);

  if(limitExport) {

  for(var i = 0; i <=5; i++) {
    console.log("Iteration Count: " + i)

    const dataUrl = croppedImage.canvas.toDataURL("image/jpeg", QUALITY);
    currentBlob = dataURItoBlob(dataUrl);
    console.log(`Blob-Größe: ${currentBlob.size} Bytes`);

    if (currentBlob.size > MAX_FILE_SIZE) {
      resizeImage(currentBlob.size, croppedImage);
    }else {
      console.log("Finished")
      console.log(currentBlob.size)
      break;
    }
  }

  }else {
    const dataUrl = croppedImage.canvas.toDataURL("image/jpeg", QUALITY);
    currentBlob = dataURItoBlob(dataUrl);
    console.log(`Blob-Größe: ${currentBlob.size} Bytes`);
  }

  saveBlob(currentBlob, imageName);

  console.log("Bild finalisiert!");
}

// function keyPressed() {
//   if(key === 'b') {
//     downloadFile();
//   }else if(key==='k'){
//     let currentBlob;

//     var factor = originalImg.width/canvasWidth;
//     croppedImage = originalImg.get((posX - rectWidth / 2)*factor, (posY - rectHeight / 2)*factor, rectWidth*factor, rectHeight*factor);

//     const dataUrl = croppedImage.canvas.toDataURL("image/jpeg", QUALITY);
//     currentBlob = dataURItoBlob(dataUrl);
//     console.log(`Blob-Größe: ${currentBlob.size} Bytes`);
//   }
// }

const resizeImage = (fileSize, img) => {
  let scaleFactor = Math.sqrt(MAX_FILE_SIZE / fileSize);
  let effectiveScaleFactor = scaleFactor * Math.sqrt(1);

  const newWidth = Math.floor(img.width * effectiveScaleFactor);
  const newHeight = Math.floor(img.height * effectiveScaleFactor);

  console.log(`Originalgröße: ${img.width}x${img.height}`);
  console.log(`Skalierte Größe: ${newWidth}x${newHeight} (Skalierungsfaktor: ${effectiveScaleFactor.toFixed(4)})`);

  img.resize(newWidth, newHeight);

  return { newWidth, newHeight };
}

const dataURItoBlob = (dataURI) => {
  var byteString = atob(dataURI.split(',')[1]);
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }
  var blob = new Blob([ab], {type: mimeString});
  return blob;
}

const saveBlob = (blob, fileName) => {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  
  var url = URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}


const toggleExportSize = (val) => {
  limitExport = val.checked;
}