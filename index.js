/*
Written by Ben Gridley
Started/finished week of 10/24/21

P.S not finished now working on an engine
in one javascript file
how horrible
1/16/22
*/

var gl;
var programInfo;
var eye;
var up;
var direction;
var torusBuffers;
var torus;
var size = 200;


var planePositions;
var car;

var planeBuffers;
var plane;
var terrainBuffers;

var e = 0;
var rad1 = 1;
var rad2 = 0.5;
var seg1 = 100;
var seg2 = 200;
var torusRotation = 0;
var loaded = false;
var clearColor = [240 / 255, 255 / 255, 255 / 255, 1.0];

var yaw = 0.0;
var pitch = 0.0;
var camY = 10;

var key_w = false;
var key_a = false;
var key_s = false;
var key_d = false;

var key_left = false;
var key_right = false;
var key_up = false;
var key_down = false;

var key_space = false;
var testRotation = 0;
var xxx = 0.0;
var xxxx = 0.0;

$(document).ready(function () {
    var x = document.getElementById("glcanvas");

   

    loadWebGL();

    x.addEventListener("click", mouseClick);
    x.addEventListener("mousemove", mouseMove);
});

function mouseClick(e) {
    document.getElementById("glcanvas").requestPointerLock();
}


function mouseMove(e) {
        //var difX = 
        car.rotY -= ((e.movementX) / 1000);
        //camY += e.movementY / 100;

}



class WorldObject {

    constructor(x, y, z, parent, offset) {
        this.onGround = false;
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotY = 0;
        this.rotX = 0;
        this.rotZ = 0;
        this.scale = vec3.fromValues(1.0, 1.0, 1.0);
        this.reflectiveness = 1.0;
        this.parent = parent;
        this.offset = offset;
    }

    draw(gl, projectionMatrix, viewMatrix) {
        const modelViewMatrix = mat4.create();

        if (this.parent != null) {
            mat4.translate(modelViewMatrix,
                modelViewMatrix,
                [this.parent.x, this.parent.y, this.parent.z]);

            mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                this.parent.rotY,
                [0, 1, 0]);



            mat4.translate(modelViewMatrix,
                modelViewMatrix,
                [this.offset[0], this.offset[1], this.offset[2]]);




        } else {
            mat4.translate(modelViewMatrix,
                modelViewMatrix,
                [this.x, this.y, this.z]);
        }

        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotY,
            [0, 1, 0]);
        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotX,
            [1, 0, 0]);
        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotZ,
            [0, 0, 1]);

        if (this.parent != null) {


            var tr = xxx;

            if (car.td <= 0 && this.offset[0] > 0) tr = -tr;
            mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                tr,
                [0, 1, 0]);
        }


        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        mat4.scale(modelViewMatrix, modelViewMatrix, this.scale);

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normal);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexNormal);
        }

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertexColor);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexColor);
        }


        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
        gl.useProgram(programInfo.program);

        gl.uniform1f(programInfo.uniformLocations.reflectiveness, this.reflectiveness);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.viewMatrix,
            false,
            viewMatrix);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            normalMatrix);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        {
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, this.buffers.vertexCount, type, offset);
        }
    }
};

class Torus extends WorldObject {

    constructor(x, y, z, parent, offset) {
        super(x, y, z, parent, offset);
        this.buffers = torusBuffers;
        this.scale = [1.0, 1.0, 1.0];
        this.rotX = Math.PI / 2;
        this.onGround = false;
        this.reflectiveness = 1;
        //this.rotY = 2;
        this.offset = offset;
        this.vy = 0;
        this.vx = 0;
        this.vz = 0;
        this.a = -0.02;
        this.speed = 0;

        this.y = calcY(this.x, this.z);
    }

    draw(gl, projectionMatrix, viewMatrix) {
        super.draw(gl, projectionMatrix, viewMatrix);
    }


   

    update() {


        var normalDirection = vec3.create();
        vec3.normalize(normalDirection, vec3.fromValues(direction[0], 0.0, direction[2]));
        var speed = 0.1;
        vec3.multiply(normalDirection, normalDirection, vec3.fromValues(speed, 0, speed));


        var reverse = vec3.create();
        vec3.multiply(reverse, normalDirection, vec3.fromValues(-1, -1, -1));


        var left_ = vec3.create();
        vec3.rotateY(left_, normalDirection, vec3.fromValues(0.0, 0.0, 0.0), Math.PI / 2);


        var right_ = vec3.create();
        vec3.rotateY(right_, normalDirection, vec3.fromValues(0.0, 0.0, 0.0), -Math.PI / 2);

        var left = vec3.fromValues(left_[0], 0.0, left_[2]);
        var right = vec3.fromValues(right_[0], 0.0, right_[2]); // tghis is a hack but i really don't want to fuckin code a rotation around axis function for vectors in javascript
   

        if (key_s) {

        }

        if (key_a) {

            //  alert(pitch);
          //  car.rotY += 0.03;
        }

        if (key_d) {

         //   car.rotY -= 0.03;
        }



        var di = vec3.create();
        if (key_a) {
            // this.z -= 0.5;
            // vec3.add(eye, eye, left);

            //di = left;
            vec3.add(di, di, left);

        }

        if (key_d) {
            // this.z += 0.5;
            // vec3.add(eye, eye, right);

            vec3.add(di, di, right);
        }

        if (key_w) {
            vec3.add(di, di, normalDirection);
            // di = normalDirection;
            // this.x += 0.5;
            // vec3.add(eye, eye, normalDirection);

        }

        if (key_s) {

            // di = reverse;
            vec3.add(di, di, reverse);
        }


        vec3.multiply(di, di, vec3.fromValues(3.0, 3.0, 3.0));

        //var nextY = calcY(this.x + di[0], this.z + di[2]);
        // var nextPoint = vec3.fromValues(x + di[0], nextY, z + di[2]);
        
        //this.vx += direction[0] * 0.1;
        //this.vz += direction[2] * 0.1;

        var newY = calcY(this.x + this.vx * speed, this.z + this.vz * speed) + this.scale[1]/2;

        speed += (newY - this.y) * 0.000001;
        //direction[0] * 0.1;
        //direction[2] * 0.1;

        console.log(this.y - newY);
        console.log("SPEED: " + speed);
        

        this.vx += direction[0] * speed;
        this.vz += direction[2] * speed;

        //this.vy += this.y - newY;

       // this.vx *= (this.y - newY);
        //this.vz *= (this.y - newY);
        
        this.x += this.vx;
        this.z += this.vz;
       
        this.y = calcY(this.x, this.z);

        this.vx *= 0.4;
        this.vz *= 0.4;
        

        //if ((nextY - this.y) <= 0 && this.onGround) {
            //this.vy = nextY - this.y;
           // this.y += (nextY - this.y);
        //}


      //  this.vy += this.a;


        //console.log();


        //  var h = planePositions[((posx * size + posz) * 3) + 1] + this.scale[1] / 2;





        //var h = (calcY(car.x, car.z) + this.scale[1] / 2);



        // console.log(h);

        //console.log(bottom);
        //var h = 0;







        /*
        // var h = ;
        // thx : https://math.stackexchange.com/questions/548431/how-to-find-the-height-of-a-2d-coordinate-on-a-four-sided-3d-polygon-plane
        if (this.y > h) {
            this.y += this.vy;
            this.onGround = false;
        } else {
            this.y = h;
            this.vy = 0;
            this.onGround = true;
        }

        if (key_space && this.onGround == true) {
            this.vy = 0.5;
            this.onGround = false;
            this.y += this.vy;
          //  alert('jump');
        }
        */

        //console.log(this.onGround);
    }
}

function calcY(x, z) {

    var posx = Math.floor(x) + size / 2;
    var posz = Math.floor(z) + size / 2;
    var os = ((posx * size + posz) * 3);

    var A = vec3.fromValues(planePositions[os], planePositions[os + 1], planePositions[os + 2]);
    var D = vec3.fromValues(planePositions[os + 3], planePositions[os + 4], planePositions[os + 5]);
    var B = vec3.fromValues(planePositions[os + size * 3], planePositions[os + 1 + size * 3], planePositions[os + 2 + size * 3]);
    var C = vec3.fromValues(planePositions[os + 3 + size * 3], planePositions[os + 4 + size * 3], planePositions[os + 5 + size * 3]);

    // var su = vec3.fromValues(1.0, 1.0, 1.0); 
    ///alert("VECTOR TEST: " + su[1]);
    var qa = ((D[2] - z) / (D[2] - A[2]) * A[1]) + ((z - A[2]) / (D[2] - A[2]) * D[1]);
    var qb = ((C[2] - z) / (C[2] - B[2]) * B[1]) + ((z - B[2]) / (C[2] - B[2]) * C[1]);


    var result = ((B[0] - x) / (B[0] - A[0]) * qa) + ((x - A[0]) / (B[0] - A[0]) * qb);

    if (isNaN(result) || !isFinite(result)) {
        result = planePositions[((posx * size + posz) * 3) + 1];
    }

    return result;
    // return -(a * x + c * z + d) / b;
}

class Plane extends WorldObject {

    constructor(x, y, z) {
        super(x, y, z);
        this.buffers = planeBuffers;
        this.scale = [1.0, 1.0, 1.0];
        this.x = 0;
        this.reflectiveness = 1;
    }

    draw(gl, projectionMatrix, viewMatrix) {
        super.draw(gl, projectionMatrix, viewMatrix);
    }
}

class Model extends WorldObject {

    constructor(x, y, z) {
        super(x, y, z);
        this.buffers = modelBuffers;
        this.scale = [0.1, 0.1, 0.1];
        this.reflectiveness = 1;
    }

    draw(gl, projectionMatrix, viewMatrix) {
        super.draw(gl, projectionMatrix, viewMatrix);
    }
}


async function loadWebGL() {
    if (!loaded) loaded = true; else return;

    document.addEventListener('keydown', function (event) {

        event.preventDefault();

        if (event.keyCode == 87) {
            key_w = true;
        } else if (event.keyCode == 65) {
            key_a = true;
        } else if (event.keyCode == 83) {
            key_s = true;
        } else if (event.keyCode == 68) {
            key_d = true;
        } else if (event.keyCode == 37) {
            key_left = true;
        } else if (event.keyCode == 39) {
            key_right = true;
        } else if (event.keyCode == 38) {
            key_up = true;
        } else if (event.keyCode == 40) {
            key_down = true;
        } else if (event.keyCode == 32) {
            key_space = true;
        }
    });

    document.addEventListener('keyup', function (event) {

        event.preventDefault();
        if (event.keyCode == 87) {
            key_w = false;
        } else if (event.keyCode == 65) {
            key_a = false;
        } else if (event.keyCode == 83) {
            key_s = false;
        } else if (event.keyCode == 68) {
            key_d = false;
        } else if (event.keyCode == 37) {
            key_left = false;
        } else if (event.keyCode == 39) {
            key_right = false;
        } else if (event.keyCode == 38) {
            key_up = false;
        } else if (event.keyCode == 40) {
            key_down = false;
        } else if (event.keyCode == 32) {
            key_space = false;
        }
    });

    const canvas = document.querySelector('#glcanvas');
    $('#glcanvas').css('style', ' box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);')
    gl = canvas.getContext('webgl', { antialias: true });

    window.addEventListener('resize', resizeCanvas, false);
    resizeCanvas();

    if (!gl) {
        alert('Unable to initialize WebGL.');
        return;
    }

    const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec3 aVertexNormal;
      attribute vec2 aTextureCoord;
      attribute vec3 aVertexColor;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uNormalMatrix;

      uniform highp float uReflectiveness;

      varying highp vec3 vLighting;
      varying highp vec3 vVertexNormal;
      varying highp vec3 vVertexColor;

      void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelViewMatrix * aVertexPosition;

        highp vec3 ambientLight = vec3(0.9, 0.9, 0.9);
        highp vec3 directionalLightColor = vec3(abs(aVertexPosition[1] * 4.0), abs(aVertexPosition[1] * 4.0), abs(aVertexPosition[1] * 4.0));
        highp vec3 directionalVector = normalize(vec3(-aVertexPosition[0], -aVertexPosition[1], -aVertexPosition[2]));
  
        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
  
        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional * uReflectiveness);

        vVertexNormal = aVertexNormal;
        vVertexColor = aVertexColor;
        
      }
    `;


    const fsSource = `
    varying highp vec3 vLighting;
    varying highp vec3 vVertexNormal;
    varying highp vec3 vVertexColor;

      void main() {
            gl_FragColor = vec4(vVertexColor.xyz, 1.0);
      }
    `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            reflectiveness: gl.getUniformLocation(shaderProgram, 'uReflectiveness'),
        },
    };

    torusBuffers = initTorusBuffers(gl);
    planeBuffers = initPlaneBuffers(gl);
    modelBuffers = await loadFileBuffers("cat.obj", gl);

    // torus = new Torus(0, 0, 0);
    plane = new Plane(0, -1, 0);
    model = new Model(-30, -1, 0);




    car = new Torus(0, 0, 0);

    direction = vec3.fromValues(1, 0, 0);
    eye = vec3.fromValues(0.0, 0, 0.0);
    up = vec3.fromValues(0.0, 1.0, 0.0);

    window.requestAnimationFrame(loop);
}

function loop(timestamp) {
    window.requestAnimationFrame(loop);
    drawScene();
    update();
}

function update() {
    e += 0.005;
    torusRotation += 1 / 100;



    var normalDirection = vec3.create();
    vec3.normalize(normalDirection, vec3.fromValues(direction[0], 0.0, direction[2]));
    var speed = 0.1;
    vec3.multiply(normalDirection, normalDirection, vec3.fromValues(speed, 0, speed));


    var reverse = vec3.create();
    vec3.multiply(reverse, normalDirection, vec3.fromValues(-1, -1, -1));


    var left_ = vec3.create();
    vec3.rotateY(left_, normalDirection, vec3.fromValues(0.0, 0.0, 0.0), Math.PI / 2);


    var right_ = vec3.create();
    vec3.rotateY(right_, normalDirection, vec3.fromValues(0.0, 0.0, 0.0), -Math.PI / 2);

    var left = vec3.fromValues(left_[0], 0.0, left_[2]);
    var right = vec3.fromValues(right_[0], 0.0, right_[2]); // tghis is a hack but i really don't want to fuckin code a rotation around axis function for vectors in javascript
    if (key_w) {
        vec3.add(eye, eye, normalDirection);
    }

    if (key_s) {
        vec3.add(eye, eye, reverse);
    }

    if (key_a) {
        vec3.add(eye, eye, left);
        //  alert(pitch);
    }

    if (key_d) {
        vec3.add(eye, eye, right);
    }


    if (key_up) {
        pitch += Math.PI / 200;

        if (pitch > Math.PI / 2 - .01) {
            pitch = (Math.PI / 2) - .01;
        }
    }


    car.update();


    if (key_down) {
        pitch -= Math.PI / 200;

        if (pitch < -Math.PI / 2 + .01) {
            pitch = -Math.PI / 2 + .01;
        }
    }

    if (key_left) {
        //yaw += Math.PI / 200;
    }

    if (key_right) {
        // yaw -= Math.PI / 200;
    }

    var xzLen = Math.cos(pitch)
    var x = xzLen * Math.cos(yaw)
    var y = Math.sin(pitch)
    var z = xzLen * Math.sin(-yaw)

    //direction = vec3.fromValues(x, y, z);
    //var copy = direction;
    //vec3.normalize(direction, copy);
    //up = vec3.fromValues(0.0, Math.sin(e), Math.cos(e));

}

function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    //gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = (60) * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 1000.0;
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    var center = vec3.create();

    var camDist = 5;

    var tx = car.x - Math.cos(car.rotY) * camDist;
    var tz = car.z + Math.sin(car.rotY) * camDist;
    camY = calcY(tx, tz) + 5 - car.y;
    eye = vec3.fromValues(tx, car.y + camY, tz);

    direction = vec3.fromValues(Math.cos(car.rotY), -camY/camDist, -Math.sin(car.rotY));
    vec3.add(center, eye, direction);
    mat4.lookAt(viewMatrix, eye, center, up);
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // car.vz -= 0.004 * Math.sin(car.rotY);//* (Math.cos(Math.PI - car.rotY));
    //   car.vx += 0.004 * Math.cos(car.rotY);

    //testRotation += 0.01;
    plane.draw(gl, projectionMatrix, viewMatrix);
    // torus.draw(gl, projectionMatrix, viewMatrix);
    car.draw(gl, projectionMatrix, viewMatrix);




    // for the y
    //console.log(car.x + ", " + (car.x + size/2));


    model.draw(gl, projectionMatrix, viewMatrix);

}

function resizeCanvas() {
    var w = $('body').innerWidth();
    var h = $('body').innerHeight();
    gl.canvas.width = w;
    gl.canvas.height = h;
    $("#glCanvas").attr('width', w);
    $("#glCanvas").attr('height', h);

    var c = document.querySelector("#glCanvas");
    c.style.width = w;
    c.style.height = h;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Error occurred during shader compilation: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function initPlaneBuffers(gl) {
    


    const positions = [];

    const vertexNormals = [];
    const vertexColors = [];

    var hs = 30;
    var d = 90;

    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {


            var val = noise.simplex2((i - size / 2) / d, (j - size / 2) / d);
            var height = (val * (hs)) - (hs / 2);
            positions.push(i - size / 2, height, j - size / 2);
            vertexNormals.push(0.0, 1.0, 0.0);

            //var c = noise.simplex2((i - size/2), (j - size / 2));
            var c = Math.random();
            vertexColors.push(c,c,c);
            //vertexColors.push(Math.random(), Math.random(), Math.random());
        }
    }


    const indices = [];    // 2 triangles per grid square x 3 vertices per triangle

    for (var y = 0; y < size - 1; y++) {
        for (var x = 0; x < size - 1; x++) {
            var start = y * size + x;
            indices.push(start);
            indices.push(start + 1);
            indices.push(start + size + 1);
            indices.push(start);
            indices.push(start + size);
            indices.push(start + size + 1);





        }
    }




    planePositions = positions.map((x) => x); // some dumb shallow copy stuff

    return initBuffers(gl, positions, indices, vertexNormals, vertexColors, indices.length);
}

async function loadFileBuffers(filepath, gl) {

    const response = await fetch(filepath);
    const text = await response.text();


    const positions = [0, 0, 0];
    const indices = [];
    const vertexNormals = [0, 0];
    const vertexColors = [];
    const vPositions = [0, 0, 0];
    const vNormals = [0, 0];

    var numIndices = 0;

    var array = text.split("\n");
    for (var i = 0; i < array.length; i++) {
        var line = array[i].split(/(\s+)/).filter(e => e.trim().length > 0)

        if (line[0] === "v") {
            vPositions.push(parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3]));
        } else if (line[0] === "vn") {
            vNormals.push(parseInt(line[1]));
            vNormals.push(parseInt(line[2]));
            vNormals.push(parseInt(line[3]));


            //alert('a')
        } else if (line[0] === "f") {

            let verts = array[i].split(' ').slice(1);
            const numTriangles = (verts.length) - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                indices.push(++numIndices);
                indices.push(++numIndices);
                indices.push(++numIndices);

                vertexColors.push(Math.random(), Math.random(), Math.random());
                vertexColors.push(Math.random(), Math.random(), Math.random());
                vertexColors.push(Math.random(), Math.random(), Math.random());

                //alert(verts[0]);
                addVertex(verts[0]);
                addVertex(verts[tri + 1]);
                addVertex(verts[tri + 2]);
            }

            //alert(numIndices);
        }
    }

    function addVertex(vert) {

        let vertexIndex = 3 * parseInt(vert.split('/')[0]);
        let normalIndex = 3 * parseInt(vert.split('/')[2]);


        // alert(vertexIndex);
        positions.push(vPositions[vertexIndex]);
        positions.push(vPositions[vertexIndex + 1]);
        positions.push(vPositions[vertexIndex + 2]);

        vertexNormals.push(vNormals[normalIndex]);
        vertexNormals.push(vNormals[normalIndex + 1]);
        vertexNormals.push(vNormals[normalIndex + 2]);


        // alert("how work")
    }


    //alert(positions.length);
    //alert(indices.length);

    //alert(indices.length);


    return initBuffers(gl, positions, indices, vertexNormals, vertexColors, indices.length);
}




function initTorusBuffers(gl) {
    const positions = [];
    const indices = [];
    const vertexNormals = [];
    const vertexColors = [];

    for (var i = 0; i < seg1; i++) {
        var inc = 2 * Math.PI / seg1;

        for (var j = 0; j < seg2; j++) {
            var inc2 = 2 * Math.PI / seg2;

            var sxx = (rad1 + (rad2 * Math.cos(j * inc2))) * Math.sin(i * inc);
            var szz = (rad1 + (rad2 * Math.cos(j * inc2))) * Math.cos(i * inc);
            var syy = rad2 * Math.sin(j * inc2);

            var cxx = rad1 * Math.sin(i * inc);
            var czz = rad1 * Math.cos(i * inc);
            var cyy = 0;

            var dxx = cxx - sxx;
            var dzz = czz - szz;
            var dyy = cyy - syy;

            positions.push(sxx);
            positions.push(syy);
            positions.push(szz);

            vertexNormals.push(dxx);
            vertexNormals.push(dyy);
            vertexNormals.push(dzz);


            var color = Math.random() / 4;
            vertexColors.push(color);
            vertexColors.push(color);
            vertexColors.push(color);
        }

    }

    for (var i = 0; i < seg1 - 1; i++) {
        for (var j = 0; j < seg2; j++) {
            var s = (i) * seg2;
            var next = s + seg2;
            if (i == seg1 - 2) next = 0;
            var n1 = next + 1;

            if (j + s + 1 == (seg1 - 1) * seg2) {
                indices.push(j + s);
                indices.push(j + next);
                indices.push(s);
                indices.push(j + next);
                indices.push(s);
                indices.push(j + next + 1);
            } else {
                indices.push(j + s);
                indices.push(j + next);
                indices.push(j + s + 1);

                if (j == seg2 - 1) {
                    s -= seg2;
                    next -= seg2;
                }

                indices.push(j + next);
                indices.push(j + s + 1);
                indices.push(j + next + 1);
            }
        }
    }

    return initBuffers(gl, positions, indices, vertexNormals, vertexColors, indices.length);//positions.length * 2);
}

function initBuffers(gl, positions, indices, vertexNormals, vertexColors, vertices) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
        gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors),
        gl.STATIC_DRAW);

    return {
        vertexCount: vertices,
        position: positionBuffer,
        indices: indexBuffer,
        normal: normalBuffer,
        vertexColor: colorBuffer,
    };
}