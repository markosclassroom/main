particlesJS("particles-js", {
    particles: {
        number: { value: 100 },
        shape: { type: "circle" },
        opacity: { value: 1 }, 
        size: { value: 8, random: true }, 
        move: {
            enable: true,
            speed: 10, 
            direction: "bottom",
            straight: false, 
            out_mode: "out"
        },
        line_linked: { enable: false }, 
        color: { value: ["#00ccff", "#3399ff", "#0066ff", "#33ccff", "#0099ff"] } 
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: false }, 
            onclick: { enable: false }
        }
    }
});

