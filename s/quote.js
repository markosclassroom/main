// Picks a random quote from the global `quotes` array (defined in text.js)
// and inserts it into the paragraph with id `mainQuote` on DOMContentLoaded.

window.addEventListener('DOMContentLoaded', function(){
  try{
    var quoteEl = document.getElementById('mainQuote');
    if(!quoteEl) return;

    // `quotes` should be defined in s/text.js. If not, fallback to a default list.
    var source = (typeof quotes !== 'undefined' && Array.isArray(quotes) && quotes.length) ? quotes : [
      "Welcome!",
      "Have a great day",
      "Play a game"
    ];
    // apply base class for animation and hover
    quoteEl.classList.add('quote');

    var isAnimating = false;

    function pickRandom(){
      return source[Math.floor(Math.random() * source.length)];
    }

    function setQuote(text){
      quoteEl.textContent = text;
    }

    // initial set and fade-in
    setQuote(pickRandom());
    // allow styles to apply then add visible class
    setTimeout(function(){
      quoteEl.classList.add('quote--visible');
    }, 20);

    // hover outline
    quoteEl.addEventListener('mouseenter', function(){
      quoteEl.classList.add('quote-hover-outline');
    });
    quoteEl.addEventListener('mouseleave', function(){
      quoteEl.classList.remove('quote-hover-outline');
    });

    // click to change: fade out, swap text, fade in
    quoteEl.addEventListener('click', function(){
      if(isAnimating) return;
      isAnimating = true;
      // fade out
      quoteEl.classList.remove('quote--visible');
      quoteEl.classList.add('quote--hidden');

      setTimeout(function(){
        // change text
        setQuote(pickRandom());
        // fade in
        quoteEl.classList.remove('quote--hidden');
        quoteEl.classList.add('quote--visible');
        // allow animation to finish before unlocking
        setTimeout(function(){ isAnimating = false; }, 350);
      }, 320);
    });
  }catch(e){
    // fail silently
    console.error('quote.js error', e);
  }
});
