const circleElement = document.getElementById('circles')
const circleCount = document.getElementById('circleNo')

circleElement.onchange = (ev) => {
  circleCount.innerText = circleElement.value
}

const DIAMETER = 10

const BOUND = 500

const playground = document.getElementById('playground')

playground.style.width = `${BOUND + DIAMETER}px`
playground.style.height = `${BOUND + DIAMETER}px`


class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // Subtract another vector from this vector
  ADD(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  SUB(other) {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  // Dot product of two vectors (returns a scalar)
  DOT(other) {
    return this.x * other.x + this.y * other.y;
  }

  // Multiply this vector by a scalar
  MUL(scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  // Divide this vector by a scalar
  DIV(scalar) {
    return new Vector(this.x / scalar, this.y / scalar);
  }

  // Magnitude (length) of the vector
  MAG() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  // Normalize the vector (convert to a unit vector)
  NORMALIZE() {
    const mag = this.MAG();
    return new Vector(this.x / mag, this.y / mag);
  }

  // Return the vector as an array [x, y]
  xy() {
    return [this.x, this.y];
  }

  // Magnitude of the vector (same as MAG)
  update(vx, vy) {
    this.x = vx;
    this.y = vy;
  }
}

class Circle {
  constructor(element, vector, x = 0, y = 0, mass = 1) {
    this.element = element
    this.x = x
    this.y = y
    this.vector = vector
    this.mass = mass
  }

  render() {
    this.element.style.top = `${this.y}px`
    this.element.style.left = `${this.x}px`
  }

  randomize() {
    this.x = Math.random() * BOUND
    this.y = Math.random() * BOUND
    this.vector = new Vector(1, 1)
  }

  // [collided vert. wall, collided hori. wall]
  checkCollision() {
    let res = [0, 0]
    if (this.x > BOUND - 1e-1 || this.x <= 0) {
      res[0] = 1
    }

    if (this.y >= BOUND - 1e-1 || this.y <= 0) {
      res[1] = 1
    }

    return res
  }

  correct(xdecay = -0.8) {
    let collisions = this.checkCollision()

    if (collisions[0]) {
      this.vector.x *= xdecay
      this.x += this.vector.x
    }

    if (collisions[1]) {
      this.vector.y *= -0.60 // bounciness
      this.vector.x *= -xdecay

    }

  }

  kick() {
    this.vector.x += Math.random() * 20 + 10
    this.vector.y += Math.random() * 20 + 10
  }

  step() {
    if (Math.abs(this.vector.x) < 1e-3) {
      this.vector.x = 0
    }

    if (Math.abs(this.vector.y) < this.ydecay) {
      this.vector.y = 0
    }

    if (this.x + this.vector.x > BOUND) {
      this.x = BOUND
    } else {
      this.x = Math.max(this.x + this.vector.x, 0)
    }

    if (this.y + this.vector.y > BOUND) {
      this.y = BOUND
    } else {
      this.y = Math.max(this.y + this.vector.y, 0)
    }
  }

}

var circles = []

var running = false

function start() {
  if (!running) {
    running = true
    requestAnimationFrame(stepSim)
  }
}

function stop() {
  running = false
}

function kick() {
  circles.forEach((item) => {
    item.kick()
  })
}

function reset() {
  circles.forEach((item) => {
    item.randomize()
    item.render()
  })
}

function updateCircles() {
  playground.innerHTML = ""
  const CIRCLES = circleElement.value

  circles = []

  console.log(`Circles: ${CIRCLES}`)


  for (let c = 0; c < CIRCLES; c++) {
    let circle = document.createElement('div')
    circle.classList.add('circle')
    if (c == 0) {
      circle.style.backgroundColor = "red"
    }
    playground.appendChild(circle)

    circles.push(new Circle(circle, new Vector(5, 5)))
  }
  reset()

}

updateCircles()


function step() {
  requestAnimationFrame(stepSim)
}

playground.addEventListener('mousemove', (ev) => {
  let [x, y, vectorx, vectory] = [ev.clientX - 9, ev.clientY - 64, ev.movementX, ev.movementY]
  let mouse = new Circle(null, new Vector(vectorx, vectory), x, y, 10)

  console.log("checking for mouse and circle")

  circles.forEach((circle) => {

    checkCollisions(circle, mouse, MOUSECOL, 60)

  })

})

const MOUSECOL = "mouse"
const CIRCLECOL = "circle"

function checkCollisions(circle1, circle2, type, diameter = DIAMETER) {
  let xdiff = circle1.x - circle2.x
  let ydiff = circle1.y - circle2.y

  let distanceSquared = xdiff ** 2 + ydiff ** 2

  if (distanceSquared ** 0.5 <= diameter) {
    let overlap = diameter - Math.sqrt(distanceSquared);

    // Separate the circles along the normal vector

    let x1 = new Vector(circle1.x, circle1.y);
    let x2 = new Vector(circle2.x, circle2.y);

    let v1 = circle1.vector;
    let v2 = circle2.vector;

    // Normal vector (direction of collision)
    let normal = x1.SUB(x2);
    let distance = normal.MAG();
    normal = normal.DIV(distance); // Normalize the normal vector

    let correction = normal.MUL(overlap / 2); // Divide by 2 to move both circles
    x1 = x1.ADD(correction);
    x2 = x2.SUB(correction);

    // Update the positions of the circles
    circle1.x = x1.x;
    circle1.y = x1.y;
    circle2.x = x2.x;
    circle2.y = x2.y;

    // Relative velocity
    let relativeVelocity = v1.SUB(v2);

    // Calculate the impulse (assuming equal mass for simplicity)
    let mass1 = circle1.mass; // Mass of circle1
    let mass2 = circle2.mass; // Mass of circle2
    let impulse = (2 * relativeVelocity.DOT(normal)) / (mass1 + mass2);

    // Update velocities
    v1 = v1.SUB(normal.MUL(impulse * mass2));
    v2 = v2.ADD(normal.MUL(impulse * mass1));


    // Update the circle vectors
    circle1.vector.update(v1.x, v1.y);

    if (type == CIRCLECOL) {
      circle2.vector.update(v2.x, v2.y);
    }
  }
}


function stepSim() {
  circles.forEach((item) => {
    item.correct()

    item.step()

    item.render()
  })

  for (let i = 0; i < circles.length; i++) {

    for (let j = i + 1; j < circles.length; j++) {
      checkCollisions(circles[i], circles[j], CIRCLECOL)
    }
  }
  if (running) {
    requestAnimationFrame(stepSim)
  }
}




// -50.42845107465128,-6.315647913504286
// -73.80950935292469,-33.31461628296871

// -50.42845107465128,-4.515647913504287
// 59.04760748233976,-31.514616282968703