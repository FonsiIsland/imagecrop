var img;
var input;

let posX = 200; // Startposition X
let posY = 200; // Startposition Y
let rectWidth = 200;
let rectHeight = 300;
let move = false;
let offsetX = 0;
let offsetY = 0;


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
    input.position(0, 500);
 
    //let croped = img.get(100, 100, img.width-100, img.height-100);
    //image(croped, 100,100);  
}

function draw() {
  background(200);

  // Draw the image if loaded.
  if (img) {
    

    if(img.width > 750){
        resizeCanvas(750, img.height / img.width * 750);
        //image(img, posX, posY, img.width, img.height);

        image(img, 0, 0, 1*width, 1 *img.height*width/img.width); 

        //img.resize(1000, 0);
    }

    
       // Koordinaten des sichtbaren Rechtecks
    let rectX = posX-(rectWidth/2) // X-Position des Rechtecks
    let rectY = posY-(rectHeight/2); // Y-Position des Rechtecks
   

    // Zeichne das graue Overlay, aber spare das Rechteck aus
    noStroke();
    fill(50, 50, 50, 150); // Dunkelgrau mit Transparenz
    rect(0, 0, width, rectY); // Oberhalb des sichtbaren Bereichs
    rect(0, rectY, rectX, rectHeight); // Links vom sichtbaren Bereich
    rect(rectX + rectWidth, rectY, width - (rectX + rectWidth), rectHeight); // Rechts vom sichtbaren Bereich
    rect(0, rectY + rectHeight, width, height - (rectY + rectHeight)); // Unterhalb des sichtbaren Bereichs

    if (move) {
      // Neue Position basierend auf der Maus
      posX = mouseX;
      posY = mouseY;
    
      // Grenzen festlegen, damit das Rechteck nicht aus dem Canvas herausgeschoben wird
      posX = constrain(mouseX - offsetX, (rectWidth/2), width - (rectWidth/2)); // Begrenzung auf Canvas-Breite
      posY = constrain(mouseY - offsetY, (rectHeight/2), height - (rectHeight/2)); // Begrenzung auf Canvas-Höhe
    }
  }
}


function mousePressed() {
  if (
    mouseX > posX - rectWidth / 2 &&
    mouseX < posX + rectWidth / 2 &&
    mouseY > posY - rectHeight / 2 &&
    mouseY < posY + rectHeight / 2
  ) {
    move = true;

    // Berechne den Offset zwischen der Maus und der Rechteckposition
    offsetX = mouseX - posX;
    offsetY = mouseY - posY;
  }
}


function mouseReleased() {
  move = false;
  //saveCanvas('myCanvas.jpg');
}


function handleImage(file) {
  if (file.type === 'image') {
    img = createImg(file.data, '');
    img.hide();
  } else {
    img = null;
  }
}

function keyPressed() {
  if (key === 's') {
    // Ausschnitt des Rechtecks erfassen
    let img = get(posX - rectWidth / 2, posY - rectHeight / 2, rectWidth, rectHeight);
    // Bild speichern
    save(img, 'rect_snapshot.png'); // Der Nutzer lädt das Bild herunter
  }
}