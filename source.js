var img;
var input;

var move = false;
var posX = 0, posY = 0;

//height of our horizontal slice
var sliceHeight = 10;

//the maximum x-offset we will apply to each slice
var offsetMax = 20;

function preload() {
  //img = loadImage('cat.jpg');
}

function setup() {
    var canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('sketch-holder');
    
  
  
   input = createFileInput(handleImage);
  input.position(0, 500);
  
  
  console.log(img)
 
 
    //let croped = img.get(100, 100, img.width-100, img.height-100);
    
    //image(croped, 100,100);
  
}

function draw() {
  background(200);

  // Draw the image if loaded.
  if (img) {
    
    if(move) {
      posX = mouseX;
      posY = mouseY;
    }
    
    image(img, posX, posY, img.width, img.height);
  }
}


function mousePressed() {
  
  move = true;
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