$(document).ready(function() {
    //the website you will connect
    var socket = io.connect();
    // var socket = io.connect("http://localhost");

    socket.on("connect", function() {
        /* action when conneted */
        modeConnect = true;
    });

    socket.on("disconnect", function() {
        /* action when conneted */
        modeConnect = false;
        easyDialog.open({
            container: "Error"
        });
    });

    //client change eventlistener
    socket.on("clientChange", function(data) {
        $clientInfo.html(data["clientNum"]);
        $fireworkInfo.html(data["fireworkNum"]);
    });

    //other click eventlistener
    socket.on("otherClick", function(data) {
        mx = cw * data["mousex"];
        my = ch * data["mousey"];
        $fireworkInfo.html(data["fireworkNum"]);
        createFirework(mx, my);
    });

    //other draw event listener
    socket.on("otherDrawClick", function(data) {
        $fireworkInfo.html(data["fireworkNum"]);
        createDrawFirework(data["posArr"])
    });

    // when animating on canvas, it is best to use requestAnimationFrame instead of setTimeout or setInterval
    // not supported in all browsers though and sometimes needs a prefix, so  need a shim
    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 30);
        };
    })();

    //  setup  basic variables
    var $mainCanvas = $("#main-canvas"),
        mainCanvasCtx = $mainCanvas[0].getContext("2d"),
        $drawMode = $("#draw-mode"),
        drawModeCtx = $drawMode[0].getContext("2d"),
        // full screen dimensions
        cw = window.innerWidth,
        ch = window.innerHeight,
        // firework collection
        fireworks = [],
        // particle collection
        particles = [],
        //firworks"s position collection
        posList = [],
        // set for  hue
        hue,
        // mouse x coordinate,
        mx,
        // mouse y coordinate
        my,

        $btnLeft = $("#btn-left"),
        $btnRight = $("#btn-right"),
        //info dom
        $clientInfo = $("#client-info"),
        $fireworkInfo = $("#firework-info"),
        //connect if or not
        modeConnect = false,
        //mode if or not
        modeToggle = false;

    // set draw mode canvas dimensions
    $drawMode[0].width = cw;
    $drawMode[0].height = ch;
    // set canvas dimensions
    $mainCanvas[0].width = cw;
    $mainCanvas[0].height = ch;

    // get a random number within a range
    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // calculate the distance between two points
    function calculateDistance(p1x, p1y, p2x, p2y) {
        var xDistance = p1x - p2x,
            yDistance = p1y - p2y;
        return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
    }

    // create firework
    function Firework(sx, sy, tx, ty) {
        // actual coordinates
        this.x = sx;
        this.y = sy;
        // starting coordinates
        this.sx = sx;
        this.sy = sy;
        // target coordinates
        this.tx = tx;
        this.ty = ty;
        // distance from starting point to target
        this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
        this.distanceTraveled = 0;
        // track the past coordinates of each firework to create a trail effect, increase the coordinate count to create more prominent trails
        this.coordinates = [];
        this.coordinateCount = 3;
        // populate initial coordinate collection with the current coordinates
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2;
        this.acceleration = 1.05;
        this.brightness = random(50, 70);
        // circle target indicator radius
        this.targetRadius = 1;
    }

    // update firework
    Firework.prototype.update = function(index) {
        // remove last item in coordinates array
        this.coordinates.pop();
        // add current coordinates to the start of the array
        this.coordinates.unshift([this.x, this.y]);

        // cycle the circle target indicator radius
        if (this.targetRadius < 8) {
            this.targetRadius += 0.3;
        } else {
            this.targetRadius = 1;
        }

        // speed up the firework
        this.speed *= this.acceleration;

        // get the current velocities based on angle and speed
        var vx = Math.cos(this.angle) * this.speed,
            vy = Math.sin(this.angle) * this.speed;
        // how far will the firework have traveled with velocities applied?
        this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

        // if the distance traveled, including velocities, is greater than the initial distance to the target, then the target has been reached
        if (this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.tx, this.ty);
            // remove the firework, use the index passed into the update function to determine which to remove
            fireworks.splice(index, 1);
        } else {
            // target not reached, keep traveling
            this.x += vx;
            this.y += vy;
        }
    }

    // draw firework
    Firework.prototype.draw = function() {
        hue = random(0, 255);
        mainCanvasCtx.beginPath();
        // move to the last tracked coordinate in the set, then draw a line to the current x and y
        mainCanvasCtx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        mainCanvasCtx.lineTo(this.x, this.y);
        mainCanvasCtx.strokeStyle = "hsl(" + hue + ", 100%, " + this.brightness + "%)";
        mainCanvasCtx.stroke();

        mainCanvasCtx.beginPath();
        // draw the target for this firework with a pulsing circle
        mainCanvasCtx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
        mainCanvasCtx.stroke();
    }

    // create particle
    function Particle(x, y) {
        this.x = x;
        this.y = y;
        // track the past coordinates of each particle to create a trail effect, increase the coordinate count to create more prominent trails
        this.coordinates = [];
        this.coordinateCount = 5;
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        // set a random angle in all possible directions, in radians
        this.angle = random(0, Math.PI * 2);
        this.speed = random(1, 10);
        // friction will slow the particle down
        this.friction = 0.95;
        // gravity will be applied and pull the particle down
        this.gravity = 1;
        // set the hue to a random number +-20 of the overall hue variable
        this.hue = random(hue - 20, hue + 20);
        this.brightness = random(50, 80);
        this.alpha = 1;
        // set how fast the particle fades out
        this.decay = random(0.015, 0.03);
    }

    // update particle
    Particle.prototype.update = function(index) {
        // remove last item in coordinates array
        this.coordinates.pop();
        // add current coordinates to the start of the array
        this.coordinates.unshift([this.x, this.y]);
        // slow down the particle
        this.speed *= this.friction;
        // apply velocity
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        // fade out the particle
        this.alpha -= this.decay;

        // remove the particle once the alpha is low enough, based on the passed in index
        if (this.alpha <= this.decay) {
            particles.splice(index, 1);
        }
    }

    // draw particle
    Particle.prototype.draw = function() {
        mainCanvasCtx.beginPath();
        // move to the last tracked coordinates in the set, then draw a line to the current x and y
        mainCanvasCtx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        mainCanvasCtx.lineTo(this.x, this.y);
        mainCanvasCtx.strokeStyle = "hsla(" + this.hue + ", 100%, " + this.brightness + "%, " + this.alpha + ")";
        mainCanvasCtx.stroke();
    }

    // create particle group/explosion
    function createParticles(x, y) {
        // increase the particle count for a bigger explosion, beware of the canvas performance hit with the increased particles though
        var particleCount = Math.floor(random(30, 45));
        while (particleCount--) {
            particles.push(new Particle(x, y));
        }
    }

    // main  loop
    function loop() {
        // this function will run endlessly with requestAnimationFrame
        requestAnimFrame(loop);

        // setting the composite operation to destination-out will allow us to clear the canvas at a specific opacity, rather than wiping it entirely
        mainCanvasCtx.globalCompositeOperation = "destination-out";
        // decrease the alpha property to create more prominent trails
        mainCanvasCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
        mainCanvasCtx.fillRect(0, 0, cw, ch);
        // change the composite operation back to our main mode
        // lighter creates bright highlight points as the fireworks and particles overlap each other
        mainCanvasCtx.globalCompositeOperation = "lighter";

        // loop over each firework, draw it, update it
        var i = fireworks.length;
        while (i--) {
            fireworks[i].draw();
            fireworks[i].update(i);
        }

        // loop over each particle, draw it, update it
        var i = particles.length;
        while (i--) {
            particles[i].draw();
            particles[i].update(i);
        }

    }


    function createFirework(mx, my) {
        fireworks.push(new Firework(cw / 2, ch, mx, my));
    }

    //draw mode 
    function createDrawFirework(posArr) {
        for (var i = posArr.length - 1; i >= 0; i--) {
            var x = cw * posArr[i]["mousex"];
            var y = ch * posArr[i]["mousey"]
            fireworks.push(new Firework(cw / 2, ch, x, y));
        };

    }

    // mouse event bindings
    $mainCanvas.on("click", function(event) {
        event.preventDefault();
        mx = event.pageX - $mainCanvas[0].offsetLeft;
        my = event.pageY - $mainCanvas[0].offsetTop;
        if (!modeConnect && !modeToggle) {
            createFirework(mx, my);
        };
        //if mode is false ,emit target click event
        if (!modeToggle) {
            socket.emit("myClick", {
                mousex: Math.floor(100 * mx / cw) / 100,
                mousey: Math.floor(100 * my / ch) / 100
            });
        };
    });
    $mainCanvas.on("touchstart", function(event) {
        event.preventDefault();
        var touches = event.originalEvent.targetTouches;
        mx = touches[0].pageX - $mainCanvas[0].offsetLeft;
        my = touches[0].pageY - $mainCanvas[0].offsetTop;
        if (!modeConnect && !modeToggle) {
            createFirework(mx, my);
        };
        //if mode is false ,emit target click event
        if (!modeToggle) {
            socket.emit("myClick", {
                mousex: Math.floor(100 * mx / cw) / 100,
                mousey: Math.floor(100 * my / ch) / 100
            });
        };
    });

    $drawMode.on("click", function(event) {
        event.preventDefault();
        var x = event.pageX - $drawMode[0].offsetLeft;
        var y = event.pageY - $drawMode[0].offsetTop;
        posList.push({
            mousex: Math.floor(100 * x / cw) / 100,
            mousey: Math.floor(100 * y / ch) / 100
        });
        drawCircle(x, y, drawModeCtx);
    });

    $drawMode.on("touchstart", function(event) {
        event.preventDefault();
        var touches = event.originalEvent.targetTouches;
        var x = touches[0].pageX - $drawMode[0].offsetLeft;
        var y = touches[0].pageY - $drawMode[0].offsetTop;
        posList.push({
            mousex: Math.floor(100 * x / cw) / 100,
            mousey: Math.floor(100 * y / ch) / 100
        });
        drawCircle(x, y, drawModeCtx);
    });
    //when draw mode is on ,draw a circle
    function drawCircle(x, y, ctx) {
        var brightness = random(50, 70);
        hue = random(0, 255);
        ctx.strokeStyle = "hsl(" + hue + ", 100%, " + brightness + "%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
    }

    // the window load and resize
    window.onload = loop;
    window.onresize = function() {
        cw = window.innerWidth;
        ch = window.innerHeight;
        $drawMode[0].width = cw;
        $drawMode[0].height = ch;
        $mainCanvas[0].width = cw;
        $mainCanvas[0].height = ch;
    }

    //UI bind events
    $btnLeft.on("click", function(event) {
        event.preventDefault();
        /* Act on the event */
        if ($btnLeft.attr("name") == "Mode") {
            $btnLeft.attr("name", "Send");
            $btnRight.attr("name", "Repeal");
            $btnLeft.val("发送");
            $btnRight.val("撤销");
            modeToggle = true;
            posList.length = 0;
            drawModeCtx.clearRect(0, 0, cw, ch);
            $drawMode.fadeIn();
        } else {
            easyDialog.open({
                container: "Send"
            });
        }
    });

    //Send confirm
    $("#Send").find("input").on("click", function(event) {
        event.preventDefault();
        /* Act on the event */
        easyDialog.close();
        // alert($(this).val());
        if ($(this).attr("name") == "ok") {
            modeToggle = false;
            $drawMode.hide();
            $btnLeft.attr("name", "Mode");
            $btnRight.attr("name", "Help");
            $btnLeft.val("模式");
            $btnRight.val("帮助");

            if (modeConnect) {
                //emit a event
                socket.emit("myDrawClick", posList);
            } else {
                easyDialog.open({
                    container: "Error",
                    callback: sendErrorDo
                });
            };
        } else {};
    });

    $btnRight.on("click", function(event) {
        event.preventDefault();
        /* Act on the event */
        if ($btnRight.attr("name") == "Help") {
            easyDialog.open({
                container: "Help"
            });
        } else {
            easyDialog.open({
                container: "Repeal"
            });
        };
    });

    //Repeal confirm
    $("#Repeal").find("input").on("click", function(event) {
        event.preventDefault();
        /* Act on the event */
        easyDialog.close();

        if ($(this).attr("name") == "ok") {
            posList.length = 0;
            drawModeCtx.clearRect(0, 0, cw, ch);
            easyDialog.open({
                container: "RepealSuccess"
            });
        } else {};
    });

    //alert box close
    $(".alert_box").find("a").on("click", function(event) {
        event.preventDefault();
        /* Act on the event */
        easyDialog.close();
    });

    //into the web ,alert this wellcome box
    easyDialog.open({
        container: "Home"
    });

    //send message error ,or connect error
    function sendErrorDo() {
        createDrawFirework(posList);
    }
});