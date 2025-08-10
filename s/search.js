function searchGames() {
    let input = document.getElementById('searchBar').value.toLowerCase();
    let games = document.getElementsByClassName('game-button');
    
    for (let game of games) {
        let gameName = game.getElementsByTagName('p')[0].innerText.toLowerCase();
        if (gameName.includes(input)) {
            game.style.display = "";
        } else {
            game.style.display = "none";
        }
    }
}
function searchToGames() {
    let query = document.getElementById('searchBar').value.trim();
    if (query) {
        window.location.href = `/s/games.html?search=${encodeURIComponent(query)}`;
    }
}
window.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search) {
        const searchBar = document.getElementById('searchBar');
        searchBar.value = search;
        searchGames();
    }
});