particlesJS("particles-js", {
    particles: {
        number: { value: 100 },
        shape: { type: "circle" },
        opacity: { value: 1 }, 
        size: { value: 2, random: true }, 
        move: {
            enable: true,
            speed: 8, 
            straight: false, 
            out_mode: "out"
        },
        line_linked: { enable: false }, 
        color: { value: ["#ffffff", "#d0e8ff", "#9fb2cf", "#afebff", "#b0c8d8"] } 
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: false }, 
            onclick: { enable: false }
        }
    }
});

// put panic url here
let PANIC_URL = 'chrome://quit';

function isTypingInField(e){
    var el = e.target;
    if(!el) return false;
    var tag = el.tagName && el.tagName.toLowerCase();
    if(tag === 'input' || tag === 'textarea') return true;
    if(el.isContentEditable) return true;
    return false;
}

// Global keydown listener for panic key (backtick / ` )
window.addEventListener('keydown', function(e){
    // Ignore when typing in input fields or when modifier keys are pressed
    if(e.ctrlKey || e.altKey || e.metaKey) return;
    if(isTypingInField(e)) return;

    // e.key === '`' for backtick; some older browsers may use e.code === 'Backquote'
    if(e.key === '`' || e.code === 'Backquote'){
        // prevent accidental behavior
        e.preventDefault();
        window.location.href = 'https://classroom.google.com/';
    }
});

window.addEventListener('DOMContentLoaded', function(){
    var searchBar = document.getElementById('searchBar');
    if(searchBar){
        searchBar.addEventListener('keydown', function(e){
            if(e.key === 'Enter' || e.keyCode === 13){
                e.preventDefault();
                if(typeof searchToGames === 'function'){
                    searchToGames();
                }
            }
        });
    }
});

