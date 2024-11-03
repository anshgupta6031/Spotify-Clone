console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs = [];
let currFolder;
const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");

// Convert seconds to "MM:SS" format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch songs from a folder and display in the song list
async function getSongs(folder) {
    currFolder = folder;
    let response = await fetch(`/${folder}/`);
    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    songs = Array.from(div.getElementsByTagName("a"))
        .filter(link => link.href.endsWith(".mp3"))
        .map(link => link.href.split(`/${folder}/`)[1]);

    // Show all songs in the playlist
    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = songs.map(song => `
        <li>
            <img class="invert" width="34" src="img/music.svg" alt="">
            <div class="info">
                <div>${decodeURIComponent(song.replaceAll("%20", " "))}</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`).join("");

    // Add event listeners to each song in the playlist
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => playMusic(songs[index]));
    });

    return songs;
}

// Play music based on the track name
function playMusic(track, pause = false) {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        playButton.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").textContent = decodeURIComponent(track);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
}

// Display albums on the page
async function displayAlbums() {
    console.log("displaying albums")
    let a = await fetch(`http://127.0.0.1:5500/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer")

    Array.from(anchors).forEach(async e => {
        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/").slice(-2)[1];

            let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`)
            let response = await a.json();

            // Create a new card div and set its HTML
            let cardHTML = `<div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                            stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg" alt="">
                <h2>${response.title}</h2>
                <p>${response.description}</p>
            </div>`;

            // Append the new card HTML to the card container
            cardContainer.insertAdjacentHTML("beforeend", cardHTML);

            // Select the newly added card and add the event listener
            let newCard = cardContainer.querySelector(`.card[data-folder="${folder}"]`);
            newCard.addEventListener("click", async item => {
                console.log("Fetching Songs");
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0]);
            });
        }
    });
}



// Main function to initialize
async function main() {
    // Get the initial song list and display albums
    await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await displayAlbums();

    // Play or pause song when play button is clicked
    playButton.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playButton.src = "img/pause.svg";
        } else {
            currentSong.pause();
            playButton.src = "img/play.svg";
        }
    });

    // Update song time and seekbar
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seek functionality
    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Toggle sidebar menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Play previous song
    previousButton.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index > 0) playMusic(songs[index - 1]);
    });

    // Play next song
    nextButton.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
    });

    // Adjust volume
    const volumeControl = document.querySelector(".range input");
    volumeControl.addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
        document.querySelector(".volume>img").src = currentSong.volume ? "img/volume.svg" : "img/mute.svg";
    });

    // Mute and unmute
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (currentSong.volume > 0) {
            e.target.src = "img/mute.svg";
            currentSong.volume = 0;
            volumeControl.value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentSong.volume = 0.1;
            volumeControl.value = 10;
        }
    });
}

main();
