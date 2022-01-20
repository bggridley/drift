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



var car;

var planeBuffers;
var plane;

var e = 0;
var rad1 = 0.75;
var rad2 = 0.25;
var seg1 = 100;
var seg2 = 200;
var torusRotation = 0;
var loaded = false;
var clearColor = [240 / 255, 255 / 255, 255 / 255, 1.0];

var yaw = 0.0;
var pitch = 0.0;

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

$(document).ready(function () {
    loadWebGL();
});

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
                this.parent.rotX,
                [1, 0, 0]);

            mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                this.parent.rotY,
                [0, 1, 0]);

            mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                this.parent.rotZ,
                [0, 0, 1]);


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
        this.reflectiveness = 1;
        //this.rotY = 2;
        this.offset = offset;
    }

    draw(gl, projectionMatrix, viewMatrix) {
        super.draw(gl, projectionMatrix, viewMatrix);
    }
}

class Car {

    /*
    Realistically, I'm programming this like an idiot because I could just make a nice parent class that contains an array and some other stuff that must be inherited by the child class. then we can just use super.draw and it will draw all of the repsect components. then all that will be overrided in the child class is the updatePosition functrion. i love javascript but it feels messy  o _ o
    */

    constructor(x, y, z) {
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.x = x;
        this.y = y;
        this.z = z;
        this.td = 0;
        this.tdt = 2; // turning threshold
        this.tdv = 1;
        this.width = 2;
        this.length = 3;
        this.rotX = 0;
        this.rotY = 0;
        this.rotZ = 0;
        this.wheels = new Array();
        this.updatePosition(); // maybe we can add some cool smoothing or interpolation to this later idek whats going on mi drunk coding
        // a
    }

    updatePosition() {
        if (this.wheels.length == 0) {
            this.wheels.push(new Torus(0, 0, 0, this, [2 * this.length, 0, -this.width])); // front left
            this.wheels.push(new Torus(0, 0, 0, this, [2 * this.length, 0, this.width])); // front right
            this.wheels.push(new Torus(0, 0, 0, this, [0, 0, -this.width])); // back left
            this.wheels.push(new Torus(0, 0, 0, this, [0, 0, this.width])); // back right
        }



        // ok so now we have four wheels if they didn't exist yet
        // now set them relative to the current position

        //
        var s = 1;
    }

    update() {


        if (key_left) {
            this.td += 0.015;
        }

        if (key_right) {
            this.td -= 0.015;
        }

        if (this.td > 1) {
            this.td = 1;
        } else if (this.td < -1) {

            this.td = -1;
        }

        if (this.td > 0) {
            this.wheels[0].rotY = (Math.atan(2 * this.length * this.td / 2));
            this.wheels[1].rotY = (Math.atan(2 * this.length * this.td / (2 + (2 * this.width))));
        } else {
            this.wheels[1].rotY = Math.PI - (Math.atan(2 * this.length * -this.td / 2));
            this.wheels[0].rotY = Math.PI - (Math.atan(2 * this.length * -this.td / (2 + (2 * this.width))));
        }


        if (key_space) {




            //car.rotY = Math.cos(car.wheels[0].rotY);
            if (car.td > 0)
                car.rotY += 0.02 * (car.wheels[0].rotY);
            else
                car.rotY -= 0.02 * (car.wheels[1].rotY);

            car.vx += 0.005 * Math.cos(car.rotY);
            car.vz += 0.005 * -Math.sin(car.rotY);

        }


        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        this.vx *= 0.98;
        this.vy *= 0.98;
        this.vz *= 0.98;

        //center
    }

    draw(gl, projectionMatrix, viewMatrix) {


        // if (this.td == 0) {
        //     this.wheels[0].rotY = 0;
        // } else if (this.td < 0) {
        //     this.wheels[0].rotY = Math.PI / 2 - Math.atan(this.length * 2 / this.td) - Math.PI;
        //     this.wheels[1].rotY = Math.PI / 2 - Math.atan(this.length * 2 / (this.td - this.width * 2)) - Math.PI;
        // } else {
        //     this.wheels[0].rotY = Math.PI / 2 - Math.atan(this.length * 2 / this.td);
        //     this.wheels[1].rotY = Math.PI / 2 - Math.atan(this.length * 2 / (this.td - this.width * 2));
        // }

        //this.rotY = Math.PI / 2;
        for (var i = 0; i < this.wheels.length; i++) {
            this.wheels[i].draw(gl, projectionMatrix, viewMatrix);
        }
    }
}


class Plane extends WorldObject {

    constructor(x, y, z) {
        super(x, y, z);
        this.buffers = planeBuffers;
        this.scale = [7.5, 7.5, 7.5];
        this.reflectiveness = 1;
    }

    draw(gl, projectionMatrix, viewMatrix) {
        super.draw(gl, projectionMatrix, viewMatrix);
    }
}


function loadWebGL() {
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

        highp vec3 ambientLight = vec3(0.7, 0.7, 0.7);
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
            gl_FragColor = vec4(vVertexColor.xyz * vLighting, 1.0);
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
    torus = new Torus(0, 0, 0);
    plane = new Plane(0, -1, 0);

    car = new Car(0, 0, 0);

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

    direction = vec3.fromValues(x, y, z);
    var copy = direction;
    vec3.normalize(direction, copy);
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
    vec3.add(center, eye, direction);
    mat4.lookAt(viewMatrix, eye, center, up);
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);


    //testRotation += 0.01;
    plane.draw(gl, projectionMatrix, viewMatrix);
    // torus.draw(gl, projectionMatrix, viewMatrix);
    car.draw(gl, projectionMatrix, viewMatrix);
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
    const positions =
        [-1, 0, -1,
        -1, 0, 1,
            1, 0, 1,
            1, 0, -1,
        ];
    const indices = [0, 1, 2, 2, 3, 0];
    const vertexNormals = [
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0];
    const vertexColors = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

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

            if (Math.random() > 0.04) {
                vertexColors.push(0.1 + Math.random());
                vertexColors.push(Math.random() / 4);
                vertexColors.push(Math.random());
            } else {
                vertexColors.push(1.0);
                vertexColors.push(1.0);
                vertexColors.push(0.7);
            }
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