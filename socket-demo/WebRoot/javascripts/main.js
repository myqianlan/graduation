$(document).ready(function() {

    var socket = io.connect('http://localhost');

    socket.on("connect", function() {
        /* action when conneted */
        modeConnect = true;
        console.log("you connect to others!")
    });
    socket.on("disconnect", function() {
        /* action when conneted */
        modeConnect = false;
        console.log("you disconnect to others!")
        //TODO
        //alert a dialog
    });

    socket.on("clientChange", function(data) {
        console.log("current connect " + data + " client");
        $clientInfo.html(data["clientNum"]);
        $fireworkInfo.html(data["fireworkNum"]);
    });
    socket.on('otherClick', function(data) {
        mx = cw * data["mousex"];
        my = ch * data["mousey"];
        $fireworkInfo.html(data["fireworkNum"]);
        createFirework(mx, my);
        console.log(data);
    });
    socket.on('otherDrawClick', function(data) {
        $fireworkInfo.html(data["fireworkNum"]);
        createDrawFirework(data["posArr"])
        console.log(data);
    });

    // when animating on canvas, it is best to use requestAnimationFrame instead of setTimeout or setInterval
    // not supported in all browsers though and sometimes needs a prefix, so we need a shim
    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
        };
    })();

    // now we will setup our basic variables for the demo
    var canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d'),
        // full screen dimensions
        cw = window.innerWidth,
        ch = window.innerHeight,
        // firework collection
        fireworks = [],
        // particle collection
        particles = [],
        // starting hue
        hue = 120,
        // when launching fireworks with a click, too many get launched at once without a limiter, one launch per 5 loop ticks
        limiterTotal = 10,
        limiterTick = 0,
        // this will time the auto launches of fireworks, one launch per 80 loop ticks
        timerTotal = 80,
        timerTick = 0,
        // mousedown = false,
        // mouse x coordinate,
        mx,
        // mouse y coordinate
        my;

    // set canvas dimensions
    canvas.width = cw;
    canvas.height = ch;

    // now we are going to setup our function placeholders for the entire demo

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
        ctx.beginPath();
        // move to the last tracked coordinate in the set, then draw a line to the current x and y
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
        ctx.stroke();

        ctx.beginPath();
        // draw the target for this firework with a pulsing circle
        ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
        ctx.stroke();
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
        ctx.beginPath();
        // move to the last tracked coordinates in the set, then draw a line to the current x and y
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
        ctx.stroke();
    }

    // create particle group/explosion
    function createParticles(x, y) {
        // increase the particle count for a bigger explosion, beware of the canvas performance hit with the increased particles though
        var particleCount = 30;
        while (particleCount--) {
            particles.push(new Particle(x, y));
        }
    }

    // main demo loop
    function loop() {
        // this function will run endlessly with requestAnimationFrame
        requestAnimFrame(loop);

        // increase the hue to get different colored fireworks over time
        hue += 5.5;

        // normally, clearRect() would be used to clear the canvas
        // we want to create a trailing effect though
        // setting the composite operation to destination-out will allow us to clear the canvas at a specific opacity, rather than wiping it entirely
        ctx.globalCompositeOperation = 'destination-out';
        // decrease the alpha property to create more prominent trails
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, cw, ch);
        // change the composite operation back to our main mode
        // lighter creates bright highlight points as the fireworks and particles overlap each other
        ctx.globalCompositeOperation = 'lighter';

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
    // mouse event bindings
    canvas.addEventListener('click', function(e) {
        e.preventDefault();
        mx = e.pageX - canvas.offsetLeft;
        my = e.pageY - canvas.offsetTop;
        if (!modeConnect && !modeToggle) {
            createFirework(mx, my);
        };

        //todo:
        if (!modeToggle) {
            socket.emit("myClick", {
                mousex: Math.floor(100 * mx / cw) / 100,
                mousey: Math.floor(100 * my / ch) / 100
            });
        };
    });

    function createFirework(mx, my) {
        fireworks.push(new Firework(cw / 2, ch, mx, my));
    }

    function createDrawFirework(posArr) {
        for (var i = posArr.length - 1; i >= 0; i--) {
            var x = cw * posArr[i]["mousex"];
            var y = ch * posArr[i]["mousey"]
            fireworks.push(new Firework(cw / 2, ch, x, y));
        };

    }
    var posList = [];
    var $drawMode = $("#draw-mode"),
        drawModeCtx = $drawMode[0].getContext('2d');
    $drawMode[0].width = window.innerWidth;
    $drawMode[0].height = window.innerHeight;

    $drawMode.on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        var x = event.pageX - $drawMode[0].offsetLeft;
        var y = event.pageY - $drawMode[0].offsetTop;
        posList.push({
            mousex: Math.floor(100 * x / cw) / 100,
            mousey: Math.floor(100 * y / ch) / 100
        });
        console.log(posList);
        drawCircle(x, y, drawModeCtx);
    });


    function drawCircle(x, y, ctx) {
        var brightness = random(50, 70);
        var hue = random(0, 255);
        ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + brightness + '%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
    }
    // once the window loads, we are ready for some fireworks!
    window.onload = loop;
    /////////////////////////
    ///////////////////
    /////////////////
    var $btnLeft = $("#btn-left"),
        $btnRight = $("#btn-right"),
        $clientInfo = $("#client-info"),
        $fireworkInfo = $("#firework-info"),
        modeConnect = false,
        modeToggle = false;

    $btnLeft.on("click", function(event) {
        event.preventDefault();
        /* Act on the event */
        if ($btnLeft.val() == "Gift") {
            $btnLeft.val("Send");
            $btnRight.val("Repeal");
            modeToggle = true;
            posList.length = 0;
            drawModeCtx.clearRect(0, 0, cw, ch);
            $drawMode.show();
        } else {
            // $btnLeft.val("Gift");
            // $btnRight.val("Help");
            // modeToggle = false;
            easyDialog.open({
                container: 'Send'
            });
        }
    });
    //Send confirm
    $("#Send").find('input').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        easyDialog.close();
        // alert($(this).val());
        if ($(this).val() == "ok") {
            console.log("ok");
            modeToggle = false;
            $drawMode.hide();
            $btnLeft.val("Gift");
            $btnRight.val("Help");

            if (modeConnect) {
                //emit a event
                socket.emit("myDrawClick", posList);
                createDrawFirework(posArr);
            } else {
                easyDialog.open({
                    container: 'Error',
                    callback: createDrawFirework(posList)
                    //TODO
                });
            };
        } else {
            console.log("cancle");
        };
    });
    $btnRight.on("click", function(event) {
        event.preventDefault();
        /* Act on the event */
        if ($btnRight.val() == "Help") {
            easyDialog.open({
                container: 'Help'
            });
        } else {
            easyDialog.open({
                container: 'Repeal'
            });
        };
    });
    //Repeal confirm
    $("#Repeal").find('input').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        easyDialog.close();
        // alert($(this).val());
        if ($(this).val() == "ok") {
            posList.length = 0;
            drawModeCtx.clearRect(0, 0, cw, ch);
            console.log("ok+RepealSuccess");
            easyDialog.open({
                container: 'RepealSuccess'
            });
        } else {
            console.log("cancle");
        };
    });
    $(".alert_box").find("a").on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        easyDialog.close();
    });

    $("header,footer,canvas").hide();
    easyDialog.open({
        container: 'Home',
        callback: login
    });

    function login(argument) {
        $("header,footer,#canvas").show();
    }
});