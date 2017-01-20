//----------global defaults
var backgroundColor, speed, numConstellations;
var swarms;
var numSwarms = 1;
var bugSize = 5;
var speed = 5;
var maxTurnSpeed = 0.1;
var maxAngularAcceleration = 0.04;

//=========================
//Setup & draw functions
//=========================
function setup() {
    makeCanvas();
    resetSwarms();
}

function makeCanvas(){
    var canvas = createCanvas(($(window).width()), $(window).height() + 50);
    canvas.parent('canvas-background');
    backgroundColor = "rgba(0, 0, 0, 0)";
};

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}


function resetSwarms(){
    swarms = new Array(numSwarms);
    for (var i = 0; i < swarms.length; i++) {
        swarms[i] = new Swarm(random(0, width), random(0, height), random(0, width), random(0, height));
    };
};

function draw() {
    //move all bugs
    clear();
    background(backgroundColor);
    noStroke();
    for (var i = 0; i < swarms.length; i++) {
        // fill(swarms[i].r, swarms[i].g, swarms[i].b);
        fill('rgba(0, 0, 0, 1)');
        for (var j = 0; j < swarms[i].bugs.length; j++) {
            swarms[i].bugs[j].update();
        };
    };
};


//=========================
//Classes
//=========================
var Swarm = function(spawnX, spawnY, destX, destY){
  //collection of bugs with a common target
  this.destination = {
      x : destX,
      y : destY
  };
  this.bugs = [];
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.a = 0.5
  this.spawnX = spawnX;
  this.spawnY = spawnY;
  this.numBugs = 300;
  this.init = function(){
      for (var i = 0; i < this.numBugs; i++) {
          this.bugs.push(new Bug(this, this.spawnX, this.spawnY, bugSize));
      };
  };
  this.init();
};

var Bug = function(parentSwarm, x, y, r){
    //member of a swarm
    var that = this;
    this.spread = 200;
    this.parentSwarm = parentSwarm;
    this.x = x + random(-1 * this.spread, this.spread);
    this.y = y + random(-1 * this.spread, this.spread);
    this.radius = r;
    this.wander = 0;
    this.maxTurnSpeed = random(maxTurnSpeed * 0.5, maxTurnSpeed * 1.5)
    this.turningSpeed = 0;
    this.vector = {
        unitVector : {
            x : 0,
            y : -1
        },
        magnitude : speed
    };

    this.acceleration = {
        magnitude   : 0,
        angular     : 0
    };

    this.accelerate = function(){
        //calculate new velocity and direction based on destination and current direction
        var unitVectorToDest = findUnitVector(this.x, this.y, this.parentSwarm.destination.x, this.parentSwarm.destination.y);
        var currentUnitVector = findUnitVector(0, 0, this.vector.unitVector.x, this.vector.unitVector.y)

        var destAngleFromOrigin = findAngleFromOrigin(unitVectorToDest);
        var currentAngleFromOrigin = findAngleFromOrigin(currentUnitVector);
        var angle = findAngle(unitVectorToDest, currentUnitVector);

        //calculate which direction to turn--very inefficient, due to be revised
        if (unitVectorToDest.y * currentUnitVector.y > 0 ) {
            if (destAngleFromOrigin > currentAngleFromOrigin) {
                angle = angle;
            } else {
                angle *= -1;
            };
        }  else {
            if (unitVectorToDest.x * currentUnitVector.x > 0) {
                if (abs(destAngleFromOrigin) + abs(currentAngleFromOrigin) == angle) {
                    if (unitVectorToDest.y > 0) {
                        angle = angle;
                    } else {
                        angle *= -1;
                    };
                } else {
                    if (unitVectorToDest.y > 0) {
                        angle *= -1;
                    } else {
                        angle = angle;
                    };
                };
            };
        };

        //only turn if not facing target
        if (!angle && angle != 0) {
            that.acceleration.angular = 0;
        } else if (abs(angle) < PI/50) {
            that.acceleration.angular = 0;
        } else {
            that.acceleration.angular += angle;
        };

        if (abs(that.acceleration.angular) > maxAngularAcceleration) {
            that.acceleration.angular *= (abs(maxAngularAcceleration / that.acceleration.angular));
        };

        if (that.acceleration.angular == 0) {
            that.turningSpeed = 0;
        } else {
            that.turningSpeed += that.acceleration.angular;
        }

        //add wander
        that.wander += random(-0.01, 0.01);
        if (abs(that.wander) > 0.05) {
            that.wander *= 0.9;
        };
        that.turningSpeed += this.wander;

        if (abs(that.turningSpeed) > this.maxTurnSpeed) {
            that.turningSpeed *= (abs(this.maxTurnSpeed / that.turningSpeed));
        };

        if (currentAngleFromOrigin < 0){
            currentAngleFromOrigin += TWO_PI;
        };

        newAngle = currentAngleFromOrigin + that.turningSpeed
        newVector = findUnitVector(0, 0, cos(newAngle), sin(newAngle))

        that.vector.unitVector.x = newVector.x;
        that.vector.unitVector.y = newVector.y;
    };

    this.accelerate();

    this.update = function(){
        this.accelerate();
        this.x += this.vector.unitVector.x * this.vector.magnitude;
        this.y += this.vector.unitVector.y * this.vector.magnitude;
        var lineVectorX = this.x + this.vector.unitVector.x * this.vector.magnitude * 2;
        var lineVectorY = this.y + this.vector.unitVector.y * this.vector.magnitude * 2;
        stroke(0, 0, 0);
        line(this.x, this.y, lineVectorX, lineVectorY);
        noStroke();
        ellipse(this.x, this.y, this.radius, this.radius);
    };
};

var Vector = function(x, y, magnitude) {
    this.x = x;
    this.y = y;
    this.magnitude = magnitude;
};

//=========================
//Movement functions
//=========================

function touchStarted() {
    for (var i = 0; i < swarms.length; i++) {
        swarms[i].destination = {
              x : mouseX,
              y : mouseY
          };
    }
};

//=========================
//Angle functions
//=========================

function findAngle(vector1, vector2) {
    //finds smaller angle between two vectors
    var angle = acos(dotProduct(vector1, vector2));
    return angle;
};

function findAngleFromOrigin(vector) {
    var originVector = new Vector(1, 0, 1);
    var angle = acos(dotProduct(vector, originVector));
    if (vector.y < 0) {
        angle *= -1
    };
    return angle;
};

function findUnitVector(x1, y1, x2, y2) {
    //calculates normal vector between two points (in order), converts to unit vector
    var unitVector;
    var normalVector = new Vector(x2 - x1, y2 - y1, null);
    var magnitude = sqrt((Math.pow(normalVector.x, 2)) + (Math.pow(normalVector.y, 2)));
    if (magnitude != 0) {
        unitVector = new Vector(normalVector.x / magnitude, normalVector.y / magnitude, 1);
    } else {
        unitVector = new Vector(1, 0, 1)
    }

    return unitVector;
};

function dotProduct(vector1, vector2){
    var dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    return dotProduct;
};
