let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");
context.lineWidth = 15;
let balls = [];
const pi = Math.PI;

function make_2d_vector(x, y) {
    vector = {}

    vector.x = x
    vector.y = y
    vector.get_magitude = function() {return (x**2 + y**2)**0.5}
    vector.get_unit = function() {return make_2d_vector(x/vector.get_magitude(), y/vector.get_magitude())}

    return vector
}

function new_ball(position, velocity, radius, density, color, bounce_efficiency, spininnes) {
    const ball = {};

    ball.position = position //px
    ball.angle = 0 //rad
    ball.radius = Number(radius) //px
    ball.mass = Number(density*ball.radius*ball.radius) //kg
    ball.color = String(color) //#rrggbb
    ball.bounce_efficiency = Number(bounce_efficiency) //0-1
    ball.spininess = Number(spininnes) //0-1
    ball.velocity = velocity //px/s
    ball.angular_velocity = 0 //rad/s
    ball.touching = []

    ball.update = function(time) {
        ball.position.x += ball.velocity.x * time;
        ball.position.y += ball.velocity.y * time;
        ball.angle += ball.angular_velocity * time;
        ball.position.y = Math.max(ball.radius, Math.min(1024-ball.radius, ball.position.y));
        ball.position.x = Math.max(ball.radius, Math.min(2560-ball.radius, ball.position.x));
    }

    ball.draw = function() {

        context.fillStyle = ball.color;
        const rgb = [
            parseInt(ball.color.slice(0, 2), 16),
            parseInt(ball.color.slice(2, 4), 16),
            parseInt(ball.color.slice(4, 6), 16)
        ];
        const inverted = `#${(255 - rgb[0]).toString(16).padStart(2, '0')}${(255 - rgb[1]).toString(16).padStart(2, '0')}${(255 - rgb[2]).toString(16).padStart(2, '0')}`;
        context.strokeStyle = inverted;

        //circle
        context.beginPath();
        context.arc(ball.position.x, ball.position.y, ball.radius, 0, 2 * pi);
        context.fill();
        context.closePath();
    }

    ball.bounce_off = function(other_ball) {

        let = this_ball = JSON.parse(JSON.stringify(ball))

        let normal_direction = make_2d_vector(other_ball.position.x - this_ball.position.x, other_ball.position.y - this_ball.position.y).get_unit();
        let tangent_direction = make_2d_vector(normal_direction.y, -normal_direction.x);
        {
            let v = this_ball.velocity
            let d = normal_direction
            let a = (v.x + v.y * d.y / d.x) / (d.x + d.y * d.y / d.x)
            let b = (a * d.y - v.y) / d.x
            this_ball.normal_magnitude = a
            this_ball.tangent_magnitude = b
        }
        {
            let v = other_ball.velocity
            let d = normal_direction
            let a = (v.x + v.y * d.y / d.x) / (d.x + d.y * d.y / d.x)
            let b = (a * d.y - v.y) / d.x
            other_ball.normal_magnitude = a
            other_ball.tangent_magnitude = b
        }
        {
            let a = other_ball.mass;
            let b = this_ball.mass;
            let c = other_ball.normal_magnitude;
            let d = this_ball.normal_magnitude;
            let g = (this_ball.bounce_efficiency+other_ball.bounce_efficiency)/2;
            let h = a**2 * c**2 + 2*a*b*c*d + b**2 * d**2;
            let i = b**2 + a*b;
            let j = -2*a*b*c - 2*b**2*d;
            let k = h - g * (a**2 * c**2 + a*b*d**2);
            let dif = Math.max(0, j**2 - 4*i*k);
            let y = (-j + Math.sqrt(dif)) / (2*i);
            let z = (-j - Math.sqrt(dif)) / (2*i);
            if (Math.abs(Math.abs(y)-Math.abs(d)) < Math.abs(Math.abs(z)-Math.abs(d))) {
                this_ball.normal_magnitude = z;
            }
            else {
                this_ball.normal_magnitude = y;
            }
        }
        ball.velocity.x = this_ball.normal_magnitude * normal_direction.x + this_ball.tangent_magnitude * tangent_direction.x;
        ball.velocity.y = this_ball.normal_magnitude * normal_direction.y + this_ball.tangent_magnitude * tangent_direction.y;
    }
    
    balls.push(ball);
    return ball;
}

const time_input = document.getElementById("time_speed");
const gravity_input = document.getElementById("gravity");

let arrow_end = false;

function run_frame() {
    let time_multiplier = 2** Number(time_input.value);
    let gravity = Number(gravity_input.value);

    //frame rate handling
    current_frame_time = Date.now();
    time_passed = (current_frame_time - last_frame_time)/1000;
    last_frame_time = current_frame_time;
    document.getElementById("frame_rate").innerHTML = Math.round(1/time_passed);
    
    //update balls
    context.clearRect(0, 0, 2560, 1024);
    for (let index = 0; index < balls.length; index++) {

        ball = balls[index];
        ball.velocity.y += gravity*time_passed*time_multiplier;
        ball.update(time_passed*time_multiplier);

        if (ball.position.y + ball.radius >= 1024 || ball.position.y - ball.radius <= 0) {ball.velocity.y *= -ball.bounce_efficiency;}

        if (ball.position.x + ball.radius >= 2560 || ball.position.x - ball.radius <= 0) {ball.velocity.x *= -ball.bounce_efficiency;}
        ball.draw();
    }

    for (let index1 = 0; index1 < balls.length; index1++) {
        ball1 = balls[index1];
        for (let index2 = index1+1; index2 < balls.length; index2++) {
            ball2 = balls[index2];

            let difference = make_2d_vector(ball2.position.x - ball1.position.x, ball2.position.y - ball1.position.y);
            let distance = Math.max(ball1.radius + ball2.radius, difference.get_magitude());
            let direction = difference.get_unit();
            ball2.position.x = ball1.position.x + (distance * direction.x);
            ball2.position.y = ball1.position.y + (distance * direction.y);

            says_touching = ball2.touching.includes(ball1);
            actually_touching = (ball1.position.x - ball2.position.x)**2 + (ball1.position.y - ball2.position.y)**2 <= (ball1.radius + ball2.radius)**2;
            
            if (says_touching !== actually_touching) {
                if (actually_touching) {
                    ball2.touching.push(ball1);
                    ball1_copy = JSON.parse(JSON.stringify(ball1))
                    ball2_copy = JSON.parse(JSON.stringify(ball2))
                    ball1.bounce_off(ball2_copy);
                    ball2.bounce_off(ball1_copy);
                }
                if (says_touching) {
                    ball2.touching.splice(ball1.touching.indexOf(ball1), 1);
                }
            }
        }
    }

    //update arrow
    if (last_mouse_position) {
        context.strokeStyle = inputs[3].value;
        context.fillStyle = inputs[3].value;
        const startx = arrow_end.x;
        const starty = arrow_end.y;
        const endx = last_mouse_position.x;
        const endy = last_mouse_position.y;
        const arrowHeadSize = 50;
        const angle = Math.atan2(endy - starty, endx - startx);
        const adjustedEndx = endx - Math.cos(angle) * arrowHeadSize;
        const adjustedEndy = endy - Math.sin(angle) * arrowHeadSize;
        
        context.beginPath();
        context.moveTo(startx, starty);
        context.lineTo(adjustedEndx, adjustedEndy);
        context.stroke();
        
        context.save();
        context.translate(endx, endy);
        context.rotate(angle);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(-arrowHeadSize, -arrowHeadSize);
        context.lineTo(-arrowHeadSize, arrowHeadSize);
        context.closePath();
        context.fill();
        context.restore();
    }

    requestAnimationFrame(run_frame);
}

let inputs = document.getElementsByClassName("input");
let labels = document.getElementsByClassName("dynamic");
for (let i = 0; i < inputs.length; i++) {
    inputs[i].oninput = function() {
        labels[i].innerHTML = inputs[i].value;
    }
}

let last_mouse_position = false;
canvas.addEventListener("mousedown", function(event){
    last_mouse_position = {x: event.clientX/canvas.clientWidth*2560, y: event.clientY/canvas.clientHeight*1024};
})
canvas.addEventListener("mouseup", function(event){
    let difference = make_2d_vector(last_mouse_position.x - event.clientX/canvas.clientWidth*2560, last_mouse_position.y - event.clientY/canvas.clientHeight*1024);
    new_ball(last_mouse_position, difference, inputs[0].value, inputs[1].value, inputs[3].value, inputs[2].value, difference.get_magitude());
    last_mouse_position = false;
})

canvas.addEventListener("mousemove", function(event){arrow_end = {x: event.clientX/canvas.clientWidth*2560, y: event.clientY/canvas.clientHeight*1024};})

let last_frame_time = Date.now();
run_frame();