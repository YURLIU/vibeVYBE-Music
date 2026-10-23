let youtubePlayer;
let currentResults = [];
let currentIndex = -1;
let playerReady = false;
let progressTimer;

function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player("youtubePlayer", {
        height: "0",
        width: "0",
        videoId: "",
        playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0
        },
        events: {
            onReady: () => {
                playerReady = true;
            },
            onStateChange: handlePlayerState
        }
    });
}

async function searchMusic() {
    const input = document.getElementById("searchInput");
    const query = input.value.trim();

    if (!query) {
        return;
    }

    const container = document.getElementById("resultsContainer");

    container.innerHTML = `
        <div class="empty-message">
            Searching...
        </div>
    `;

    const url =
        "https://www.googleapis.com/youtube/v3/search" +
        "?part=snippet" +
        "&type=video" +
        "&maxResults=12" +
        "&q=" + encodeURIComponent(query) +
        "&key=" + YOUTUBE_API_KEY;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items) {
            container.innerHTML = `
                <div class="empty-message">
                    Nothing found.
                </div>
            `;
            return;
        }

        currentResults = data.items;
        displayResults(data.items);

    } catch (error) {
        container.innerHTML = `
            <div class="empty-message">
                Search error.
            </div>
        `;
    }
}

function displayResults(items) {
    const container = document.getElementById("resultsContainer");

    document.getElementById("resultCount").textContent =
        items.length + " results";

    container.innerHTML = "";

    items.forEach((item, index) => {

        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const channel = item.snippet.channelTitle;
        const image = item.snippet.thumbnails.high.url;

        const card = document.createElement("article");

        card.className = "music-card";

        card.innerHTML = `
            <div class="music-image">
                <img src="${image}" alt="">
                <button class="card-play">▶</button>
            </div>

            <div class="music-card-info">
                <h3>${escapeHTML(title)}</h3>
                <p>${escapeHTML(channel)}</p>

                <button class="add-button">
                    + PLAYLIST
                </button>
            </div>
        `;

        card.querySelector(".card-play").addEventListener("click", () => {
            playSong(index);
        });

        card.querySelector(".add-button").addEventListener("click", () => {
            saveSongToPlaylist(item);
        });

        container.appendChild(card);
    });
}

function playSong(index) {
    if (!currentResults[index]) {
        return;
    }

    currentIndex = index;

    const item = currentResults[index];

    const videoId = item.id.videoId;
    const title = item.snippet.title;
    const artist = item.snippet.channelTitle;
    const image = item.snippet.thumbnails.high.url;

    document.getElementById("playerTitle").textContent = title;
    document.getElementById("playerArtist").textContent = artist;
    document.getElementById("playerImage").src = image;

    if (youtubePlayer && playerReady) {
        youtubePlayer.loadVideoById(videoId);
        youtubePlayer.playVideo();
    }

    saveToHistory(item);

    document.getElementById("player").classList.add("visible");
    document.getElementById("playButton").textContent = "Ⅱ";

    startProgress();
}

function handlePlayerState(event) {

    if (event.data === YT.PlayerState.PLAYING) {
        document.getElementById("playButton").textContent = "Ⅱ";
        startProgress();
    }

    if (event.data === YT.PlayerState.PAUSED) {
        document.getElementById("playButton").textContent = "▶";
        stopProgress();
    }

    if (event.data === YT.PlayerState.ENDED) {
        nextSong();
    }
}

function togglePlay() {

    if (!youtubePlayer || !playerReady || currentIndex === -1) {
        return;
    }

    const state = youtubePlayer.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
        youtubePlayer.pauseVideo();
    } else {
        youtubePlayer.playVideo();
    }
}

function nextSong() {

    if (currentIndex < currentResults.length - 1) {
        playSong(currentIndex + 1);
    }
}

function previousSong() {

    if (currentIndex > 0) {
        playSong(currentIndex - 1);
    }
}

function startProgress() {

    stopProgress();

    progressTimer = setInterval(() => {

        if (!youtubePlayer || !playerReady) {
            return;
        }

        const duration = youtubePlayer.getDuration();
        const current = youtubePlayer.getCurrentTime();

        if (!duration) {
            return;
        }

        document.getElementById("progressBar").value =
            (current / duration) * 100;

        document.getElementById("currentTime").textContent =
            formatTime(current);

        document.getElementById("duration").textContent =
            formatTime(duration);

    }, 500);
}

function stopProgress() {
    clearInterval(progressTimer);
}

document.getElementById("progressBar").addEventListener("input", (event) => {

    if (!youtubePlayer || !playerReady) {
        return;
    }

    const duration = youtubePlayer.getDuration();

    youtubePlayer.seekTo(
        duration * (event.target.value / 100),
        true
    );
});

document.getElementById("playButton").addEventListener("click", togglePlay);
document.getElementById("nextButton").addEventListener("click", nextSong);
document.getElementById("previousButton").addEventListener("click", previousSong);

document.getElementById("searchButton").addEventListener("click", searchMusic);

document.getElementById("searchInput").addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        searchMusic();
    }
});

function formatTime(seconds) {

    seconds = Math.floor(seconds);

    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return minutes + ":" + String(remaining).padStart(2, "0");
}

async function saveToHistory(item) {

    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    await supabaseClient
        .from("history")
        .insert({
            user_id: user.id,
            video_id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url
        });

    loadHistory();
}

async function loadHistory() {

    const user = await getCurrentUser();
    const container = document.getElementById("historyContainer");

    if (!user) {
        container.innerHTML = `
            <div class="empty-message">
                Log in to save your listening history.
            </div>
        `;
        return;
    }

    const { data } = await supabaseClient
        .from("history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                Nothing played yet.
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    data.forEach(item => {

        const element = document.createElement("div");

        element.className = "history-item";

        element.innerHTML = `
            <img src="${item.thumbnail}" alt="">

            <div>
                <strong>${escapeHTML(item.title)}</strong>
                <span>${escapeHTML(item.channel)}</span>
            </div>

            <button>▶</button>
        `;

        element.querySelector("button").addEventListener("click", () => {

            const found = currentResults.findIndex(
                result => result.id.videoId === item.video_id
            );

            if (found !== -1) {
                playSong(found);
            } else {
                youtubePlayer.loadVideoById(item.video_id);
                document.getElementById("playerTitle").textContent = item.title;
                document.getElementById("playerArtist").textContent = item.channel;
                document.getElementById("playerImage").src = item.thumbnail;
            }

        });

        container.appendChild(element);
    });
}

async function saveSongToPlaylist(item) {

    const user = await getCurrentUser();

    if (!user) {
        showNotification("Log in to create playlists.");
        return;
    }

    const { data: playlists } = await supabaseClient
        .from("playlists")
        .select("*")
        .eq("user_id", user.id);

    if (!playlists || playlists.length === 0) {
        showNotification("Create a playlist first.");
        return;
    }

    const playlist = playlists[0];

    await supabaseClient
        .from("playlist_songs")
        .insert({
            playlist_id: playlist.id,
            video_id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url
        });

    showNotification("Added to " + playlist.name);
}

function showNotification(text) {

    const notification = document.createElement("div");

    notification.className = "notification";
    notification.textContent = text;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("hide");

        setTimeout(() => {
            notification.remove();
        }, 300);

    }, 2200);
}

function escapeHTML(text) {

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadHistory();