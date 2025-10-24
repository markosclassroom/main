
window.addEventListener('DOMContentLoaded', function(){
  try{
    var quoteEl = document.getElementById('mainQuote');
    if(!quoteEl) return;

    var source = (typeof quotes !== 'undefined' && Array.isArray(quotes) && quotes.length) ? quotes : [
      "404: Quotes Not Found"
    ];
    quoteEl.classList.add('quote');

    var isAnimating = false;

    function pickRandom(){
      return source[Math.floor(Math.random() * source.length)];
    }

    function setQuote(text){
      quoteEl.textContent = text;
    }

    setQuote(pickRandom());
    setTimeout(function(){
      quoteEl.classList.add('quote--visible');
    }, 20);

    quoteEl.addEventListener('mouseenter', function(){
      quoteEl.classList.add('quote-hover-outline');
    });
    quoteEl.addEventListener('mouseleave', function(){
      quoteEl.classList.remove('quote-hover-outline');
    });

    quoteEl.addEventListener('click', function(){
      if(isAnimating) return;
      isAnimating = true;
      quoteEl.classList.remove('quote--visible');
      quoteEl.classList.add('quote--hidden');

      setTimeout(function(){
        setQuote(pickRandom());
        quoteEl.classList.remove('quote--hidden');
        quoteEl.classList.add('quote--visible');
        setTimeout(function(){ isAnimating = false; }, 350);
      }, 320);
    });
  }catch(e){
    console.error('quote.js error', e);
  }
});
