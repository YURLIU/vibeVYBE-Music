const YOUTUBE_API_KEY = "AIzaSyAHbtrKaw6sOM621izVoQkpTHpWBbUCxaQ";

let currentUser = JSON.parse(localStorage.getItem("vibeUser")) || null;
let playlists = JSON.parse(localStorage.getItem("vibePlaylists")) || [];
let history = JSON.parse(localStorage.getItem("vibeHistory")) || [];

let currentSongs = [];
let currentSongIndex = -1;
let currentSong = null;

let player = null;
let playerReady = false;


/* =========================
   LOCAL STORAGE
========================= */

function saveData() {
    localStorage.setItem("vibeUser", JSON.stringify(currentUser));
    localStorage.setItem("vibePlaylists", JSON.stringify(playlists));
    localStorage.setItem("vibeHistory", JSON.stringify(history));
}


/* =========================
   HELPERS
========================= */

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

function getDefaultAvatar() {
    return "https://ui-avatars.com/api/?name=V&background=101411&color=b6ff00&size=300";
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${secs}`;
}

function showMessage(message) {
    const oldMessage = document.querySelector(".site-message");

    if (oldMessage) {
        oldMessage.remove();
    }

    const box = document.createElement("div");

    box.className = "site-message";
    box.textContent = message;

    box.style.position = "fixed";
    box.style.top = "25px";
    box.style.left = "50%";
    box.style.transform = "translateX(-50%)";
    box.style.zIndex = "9999";
    box.style.background = "#b6ff00";
    box.style.color = "#050607";
    box.style.padding = "13px 22px";
    box.style.borderRadius = "100px";
    box.style.fontWeight = "800";
    box.style.fontSize = "12px";
    box.style.boxShadow = "0 0 40px rgba(182,255,0,.3)";

    document.body.appendChild(box);

    setTimeout(() => {
        if (box) {
            box.remove();
        }
    }, 2500);
}


/* =========================
   HEADER
========================= */

function updateHeader() {
    const headerLogin = document.getElementById("headerLogin");

    if (!headerLogin) {
        return;
    }

    if (currentUser) {
        headerLogin.textContent = currentUser.name || "Профиль";
        headerLogin.href = "profile.html";
    } else {
        headerLogin.textContent = "Войти";
        headerLogin.href = "login.html";
    }
}


/* =========================
   HISTORY
========================= */

function addToHistory(song) {
    if (!song) {
        return;
    }

    history = history.filter(
        item => item.videoId !== song.videoId
    );

    history.unshift({
        videoId: song.videoId,
        title: song.title,
        channel: song.channel,
        thumbnail: song.thumbnail
    });

    history = history.slice(0, 30);

    saveData();

    renderHistory("historyList");
    renderHistory("profileHistory");
    updateProfileStats();
}

function createHistoryItem(song) {
    return `
        <div class="history-item">

            <img
                src="${song.thumbnail}"
                alt=""
            >

            <div class="history-info">

                <strong>
                    ${escapeHTML(song.title)}
                </strong>

                <span>
                    ${escapeHTML(song.channel)}
                </span>

            </div>

            <button onclick="playHistorySong('${song.videoId}')">
                ▶
            </button>

        </div>
    `;
}

function renderHistory(targetId) {
    const target = document.getElementById(targetId);

    if (!target) {
        return;
    }

    if (history.length === 0) {
        target.innerHTML = `
            <div class="empty-state">

                <div>♫</div>

                <h3>
                    Пока здесь пусто
                </h3>

                <p>
                    Послушай несколько песен — они появятся здесь.
                </p>

            </div>
        `;

        return;
    }

    target.innerHTML = history
        .slice(0, 10)
        .map(createHistoryItem)
        .join("");
}

window.playHistorySong = function(videoId) {
    const song = history.find(
        item => item.videoId === videoId
    );

    if (!song) {
        return;
    }

    currentSongs = [song];
    currentSongIndex = 0;

    playSong(song);
};


/* =========================
   YOUTUBE PLAYER
========================= */

function onYouTubeIframeAPIReady() {

    const youtubeElement =
        document.getElementById("youtubePlayer");

    if (!youtubeElement) {
        return;
    }

    console.log("Создаём YouTube PLAYER...");

    player = new YT.Player("youtubePlayer", {

        height: "200",
        width: "300",

        videoId: "",

        playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1
        },

        events: {

            onReady: function(event) {

                playerReady = true;

                console.log("YouTube PLAYER ГОТОВ");

                const iframe =
                    event.target.getIframe();

                if (iframe) {
                    iframe.setAttribute(
                        "allow",
                        "autoplay; encrypted-media"
                    );
                }
            },

            onStateChange: function(event) {

                const playButton =
                    document.getElementById("playButton");

                if (!playButton) {
                    return;
                }

                if (
                    event.data ===
                    YT.PlayerState.PLAYING
                ) {
                    playButton.textContent = "Ⅱ";
                } else {
                    playButton.textContent = "▶";
                }

                if (
                    event.data ===
                    YT.PlayerState.ENDED
                ) {
                    playNextSong();
                }
            },

            onError: function(event) {

                console.error(
                    "ОШИБКА YOUTUBE:",
                    event.data
                );

                showMessage(
                    "YouTube не может воспроизвести эту песню"
                );
            }
        }
    });
}

window.onYouTubeIframeAPIReady =
    onYouTubeIframeAPIReady;


/* =========================
   PLAY SONG
========================= */

function playSong(song) {

    if (!song) {
        return;
    }

    currentSong = song;

    const playerTitle =
        document.getElementById("playerTitle");

    const playerArtist =
        document.getElementById("playerArtist");

    const playerImage =
        document.getElementById("playerImage");

    if (playerTitle) {
        playerTitle.textContent = song.title;
    }

    if (playerArtist) {
        playerArtist.textContent = song.channel;
    }

    if (playerImage) {
        playerImage.src = song.thumbnail;
    }

    addToHistory(song);

    if (!player) {
        showMessage("YouTube плеер ещё не создан");
        console.log("PLAYER = null");
        return;
    }

    if (!playerReady) {
        showMessage("YouTube плеер ещё загружается");
        console.log("PLAYER ещё не готов");
        return;
    }

    console.log(
        "Запускаем песню:",
        song.videoId
    );

    try {

        player.loadVideoById({
            videoId: song.videoId,
            startSeconds: 0
        });

        player.playVideo();

    } catch (error) {

        console.error(
            "Ошибка запуска:",
            error
        );

        showMessage(
            "Не удалось запустить песню"
        );
    }
}


/* =========================
   SEARCH
========================= */

async function searchYouTube(query) {

    const results =
        document.getElementById("searchResults");

    if (!results) {
        return;
    }

    query = query.trim();

    if (!query) {
        showMessage("Напиши название песни");
        return;
    }

    if (
        !YOUTUBE_API_KEY ||
        YOUTUBE_API_KEY ===
        "ВСТАВЬ_СЮДА_СВОЙ_YOUTUBE_API_KEY"
    ) {

        results.innerHTML = `
            <div class="empty-state">

                <div>⚠</div>

                <h3>
                    Нужен YouTube API ключ
                </h3>

                <p>
                    Вставь свой API ключ в начало script.js.
                </p>

            </div>
        `;

        return;
    }

    results.innerHTML = `
        <div class="empty-state">

            <div>⌛</div>

            <h3>
                Ищу музыку...
            </h3>

        </div>
    `;

    try {

        const url =
            "https://www.googleapis.com/youtube/v3/search" +
            "?part=snippet" +
            "&type=video" +
            "&videoEmbeddable=true" +
            "&maxResults=12" +
            "&q=" +
            encodeURIComponent(query) +
            "&key=" +
            encodeURIComponent(YOUTUBE_API_KEY);

        const response =
            await fetch(url);

        const data =
            await response.json();

        console.log(
            "YouTube SEARCH:",
            data
        );

        if (!response.ok) {

            console.error(
                "YouTube API ERROR:",
                data
            );

            results.innerHTML = `
                <div class="empty-state">

                    <div>⚠</div>

                    <h3>
                        Ошибка YouTube API
                    </h3>

                    <p>
                        Проверь API ключ.
                    </p>

                </div>
            `;

            return;
        }

        if (
            !data.items ||
            data.items.length === 0
        ) {

            results.innerHTML = `
                <div class="empty-state">

                    <div>⌕</div>

                    <h3>
                        Ничего не найдено
                    </h3>

                    <p>
                        Попробуй другое название.
                    </p>

                </div>
            `;

            return;
        }

        currentSongs =
            data.items
                .filter(item => item.id.videoId)
                .map(item => ({

                    videoId:
                        item.id.videoId,

                    title:
                        item.snippet.title,

                    channel:
                        item.snippet.channelTitle,

                    thumbnail:
                        item.snippet.thumbnails.high?.url ||
                        item.snippet.thumbnails.medium?.url ||
                        item.snippet.thumbnails.default?.url
                }));

        currentSongIndex = -1;

        renderSearchResults();

        const resultCount =
            document.getElementById("resultCount");

        if (resultCount) {
            resultCount.textContent =
                `${currentSongs.length} найдено`;
        }

    } catch (error) {

        console.error(
            "Ошибка поиска:",
            error
        );

        results.innerHTML = `
            <div class="empty-state">

                <div>⚠</div>

                <h3>
                    Не получилось выполнить поиск
                </h3>

                <p>
                    Проверь интернет-соединение.
                </p>

            </div>
        `;
    }
}


/* =========================
   SEARCH RESULTS
========================= */

function renderSearchResults() {

    const results =
        document.getElementById("searchResults");

    if (!results) {
        return;
    }

    if (currentSongs.length === 0) {
        return;
    }

    results.innerHTML =
        currentSongs
            .map((song, index) => {

                return `
                    <div class="music-card">

                        <img
                            class="music-cover"
                            src="${song.thumbnail}"
                            alt=""
                        >

                        <div class="music-card-content">

                            <div class="music-card-title">
                                ${escapeHTML(song.title)}
                            </div>

                            <div class="music-card-artist">
                                ${escapeHTML(song.channel)}
                            </div>

                            <div class="music-actions">

                                <button
                                    onclick="playSearchSong(${index})">
                                    ▶
                                </button>

                                <button
                                    onclick="openPlaylistModal(${index})">
                                    ＋
                                </button>

                            </div>

                        </div>

                    </div>
                `;
            })
            .join("");
}

window.playSearchSong = function(index) {

    const song =
        currentSongs[index];

    if (!song) {
        return;
    }

    currentSongIndex = index;

    playSong(song);
};


/* =========================
   PLAYER BUTTONS
========================= */

const playButton =
    document.getElementById("playButton");

if (playButton) {

    playButton.addEventListener(
        "click",
        function() {

            if (!player || !playerReady) {
                showMessage(
                    "Плеер ещё загружается"
                );

                return;
            }

            if (!currentSong) {
                showMessage(
                    "Сначала выбери песню"
                );

                return;
            }

            const state =
                player.getPlayerState();

            if (
                state ===
                YT.PlayerState.PLAYING
            ) {

                player.pauseVideo();

            } else {

                player.playVideo();
            }
        }
    );
}


function playNextSong() {

    if (
        currentSongIndex < 0 ||
        currentSongIndex >=
        currentSongs.length - 1
    ) {
        return;
    }

    currentSongIndex++;

    playSong(
        currentSongs[currentSongIndex]
    );
}


function playPreviousSong() {

    if (currentSongIndex <= 0) {
        return;
    }

    currentSongIndex--;

    playSong(
        currentSongs[currentSongIndex]
    );
}


const previousButton =
    document.getElementById("previousButton");

if (previousButton) {

    previousButton.addEventListener(
        "click",
        playPreviousSong
    );
}


const nextButton =
    document.getElementById("nextButton");

if (nextButton) {

    nextButton.addEventListener(
        "click",
        playNextSong
    );
}


/* =========================
   PROGRESS
========================= */

const progressBar =
    document.getElementById("progressBar");

setInterval(function() {

    if (
        !player ||
        !playerReady ||
        !currentSong
    ) {
        return;
    }

    try {

        const current =
            player.getCurrentTime();

        const duration =
            player.getDuration();

        if (!duration) {
            return;
        }

        const percentage =
            (current / duration) * 100;

        if (progressBar) {
            progressBar.value =
                percentage;
        }

        const currentTime =
            document.getElementById("currentTime");

        const durationElement =
            document.getElementById("duration");

        if (currentTime) {
            currentTime.textContent =
                formatTime(current);
        }

        if (durationElement) {
            durationElement.textContent =
                formatTime(duration);
        }

    } catch (error) {
    }

}, 500);


if (progressBar) {

    progressBar.addEventListener(
        "input",
        function() {

            if (!player || !playerReady) {
                return;
            }

            try {

                const duration =
                    player.getDuration();

                const time =
                    (progressBar.value / 100) *
                    duration;

                player.seekTo(
                    time,
                    true
                );

            } catch (error) {
            }
        }
    );
}


/* =========================
   SEARCH BUTTON
========================= */

const searchButton =
    document.getElementById("searchButton");

const searchInput =
    document.getElementById("searchInput");

if (searchButton && searchInput) {

    searchButton.addEventListener(
        "click",
        function() {

            searchYouTube(
                searchInput.value
            );
        }
    );

    searchInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                searchYouTube(
                    searchInput.value
                );
            }
        }
    );
}


/* =========================
   PLAYLISTS
========================= */

function createPlaylistCover() {

    return `
        data:image/svg+xml;charset=UTF-8,
        ${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg"
                 width="500"
                 height="500">

                <rect
                    width="100%"
                    height="100%"
                    fill="#101411"/>

                <circle
                    cx="120"
                    cy="120"
                    r="180"
                    fill="#b6ff00"
                    opacity=".25"/>

                <circle
                    cx="400"
                    cy="400"
                    r="180"
                    fill="#9d45ff"
                    opacity=".3"/>

                <text
                    x="50%"
                    y="55%"
                    text-anchor="middle"
                    fill="#b6ff00"
                    font-size="100">
                    ♫
                </text>

            </svg>
        `)}
    `;
}


function openPlaylistModal(index) {

    const modal =
        document.getElementById("playlistModal");

    if (!modal) {
        return;
    }

    const song =
        currentSongs[index];

    if (!song) {
        return;
    }

    currentSong = song;

    const choices =
        document.getElementById(
            "playlistChoices"
        );

    if (!choices) {
        return;
    }

    if (playlists.length === 0) {

        choices.innerHTML = `
            <div class="empty-state">

                <div>＋</div>

                <h3>
                    Плейлистов пока нет
                </h3>

                <p>
                    Создай свой первый плейлист.
                </p>

            </div>
        `;

    } else {

        choices.innerHTML =
            playlists
                .map(
                    (playlist, playlistIndex) => {

                        return `
                            <button
                                class="playlist-choice"
                                onclick="addSongToPlaylist(${playlistIndex})">

                                <img
                                    src="${playlist.cover || createPlaylistCover()}"
                                    alt=""
                                >

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            playlist.name
                                        )}
                                    </strong>

                                    <small>
                                        ${playlist.songs.length}
                                        песен
                                    </small>

                                </div>

                            </button>
                        `;
                    }
                )
                .join("");
    }

    modal.classList.add("show");
}

window.openPlaylistModal =
    openPlaylistModal;


window.addSongToPlaylist =
    function(index) {

        if (!currentSong) {
            return;
        }

        const playlist =
            playlists[index];

        if (!playlist) {
            return;
        }

        const exists =
            playlist.songs.some(
                song =>
                    song.videoId ===
                    currentSong.videoId
            );

        if (exists) {

            showMessage(
                "Эта песня уже есть в плейлисте"
            );

            return;
        }

        playlist.songs.push({
            videoId: currentSong.videoId,
            title: currentSong.title,
            channel: currentSong.channel,
            thumbnail: currentSong.thumbnail
        });

        saveData();

        showMessage(
            "Песня добавлена в плейлист"
        );

        const modal =
            document.getElementById(
                "playlistModal"
            );

        if (modal) {
            modal.classList.remove("show");
        }

        renderPlaylists();
        updateProfileStats();
    };


function renderPlaylists() {

    const grid =
        document.getElementById(
            "playlistsGrid"
        );

    if (!grid) {
        return;
    }

    if (playlists.length === 0) {

        grid.innerHTML = `
            <div class="empty-state">

                <div>＋</div>

                <h3>
                    Создай свой первый плейлист
                </h3>

                <p>
                    Собери музыку под своё настроение.
                </p>

            </div>
        `;

        return;
    }

    grid.innerHTML =
        playlists
            .map(
                (playlist, index) => {

                    return `
                        <div class="playlist-card">

                            <img
                                class="playlist-cover"
                                src="${playlist.cover || createPlaylistCover()}"
                                alt=""
                            >

                            <h3>
                                ${escapeHTML(
                                    playlist.name
                                )}
                            </h3>

                            <p>
                                ${playlist.songs.length}
                                песен
                            </p>

                            <button
                                onclick="deletePlaylist(${index})">
                                Удалить
                            </button>

                        </div>
                    `;
                }
            )
            .join("");
}


window.deletePlaylist =
    function(index) {

        if (
            !confirm(
                "Удалить этот плейлист?"
            )
        ) {
            return;
        }

        playlists.splice(index, 1);

        saveData();

        renderPlaylists();
        updateProfileStats();

        showMessage(
            "Плейлист удалён"
        );
    };


/* =========================
   CREATE PLAYLIST
========================= */

function createPlaylist() {

    const nameInput =
        document.getElementById(
            "playlistName"
        );

    const coverInput =
        document.getElementById(
            "playlistCover"
        );

    if (!nameInput) {
        return;
    }

    const name =
        nameInput.value.trim();

    if (!name) {

        showMessage(
            "Напиши название плейлиста"
        );

        return;
    }

    const file =
        coverInput?.files[0];

    if (file) {

        const reader =
            new FileReader();

        reader.onload =
            function() {

                saveNewPlaylist(
                    name,
                    reader.result
                );
            };

        reader.readAsDataURL(file);

    } else {

        saveNewPlaylist(
            name,
            null
        );
    }
}


function saveNewPlaylist(
    name,
    cover
) {

    playlists.push({

        id: Date.now(),

        name: name,

        cover: cover,

        songs: []
    });

    saveData();

    renderPlaylists();
    updateProfileStats();

    const modal =
        document.getElementById(
            "createPlaylistModal"
        );

    if (modal) {
        modal.classList.remove("show");
    }

    const nameInput =
        document.getElementById(
            "playlistName"
        );

    const coverInput =
        document.getElementById(
            "playlistCover"
        );

    if (nameInput) {
        nameInput.value = "";
    }

    if (coverInput) {
        coverInput.value = "";
    }

    showMessage(
        "Плейлист создан"
    );
}


const createPlaylistButton =
    document.getElementById(
        "createPlaylistButton"
    );

if (createPlaylistButton) {

    createPlaylistButton.addEventListener(
        "click",
        function() {

            const modal =
                document.getElementById(
                    "createPlaylistModal"
                );

            if (modal) {
                modal.classList.add("show");
            }
        }
    );
}


const closeCreateModal =
    document.getElementById(
        "closeCreateModal"
    );

if (closeCreateModal) {

    closeCreateModal.addEventListener(
        "click",
        function() {

            const modal =
                document.getElementById(
                    "createPlaylistModal"
                );

            if (modal) {
                modal.classList.remove("show");
            }
        }
    );
}


const savePlaylistButton =
    document.getElementById(
        "savePlaylistButton"
    );

if (savePlaylistButton) {

    savePlaylistButton.addEventListener(
        "click",
        createPlaylist
    );
}


const coverInput =
    document.getElementById(
        "playlistCover"
    );

if (coverInput) {

    coverInput.addEventListener(
        "change",
        function() {

            const file =
                coverInput.files[0];

            if (!file) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                function(event) {

                    const preview =
                        document.getElementById(
                            "coverPreview"
                        );

                    if (preview) {

                        preview.innerHTML = `
                            <img
                                src="${event.target.result}"
                                alt="">
                        `;
                    }
                };

            reader.readAsDataURL(file);
        }
    );
}


/* =========================
   MODALS
========================= */

const closePlaylistModal =
    document.getElementById(
        "closePlaylistModal"
    );

if (closePlaylistModal) {

    closePlaylistModal.addEventListener(
        "click",
        function() {

            const modal =
                document.getElementById(
                    "playlistModal"
                );

            if (modal) {
                modal.classList.remove("show");
            }
        }
    );
}


const newPlaylistFromModal =
    document.getElementById(
        "newPlaylistFromModal"
    );

if (newPlaylistFromModal) {

    newPlaylistFromModal.addEventListener(
        "click",
        function() {

            const playlistModal =
                document.getElementById(
                    "playlistModal"
                );

            const createModal =
                document.getElementById(
                    "createPlaylistModal"
                );

            if (playlistModal) {
                playlistModal.classList.remove(
                    "show"
                );
            }

            if (createModal) {
                createModal.classList.add(
                    "show"
                );
            }
        }
    );
}


/* =========================
   PROFILE
========================= */

function updateProfileStats() {

    const songCount =
        document.getElementById(
            "songCount"
        );

    const playlistCount =
        document.getElementById(
            "playlistCount"
        );

    const historyCount =
        document.getElementById(
            "historyCount"
        );

    if (songCount) {

        const songs =
            playlists.reduce(
                function(total, playlist) {

                    return total +
                        playlist.songs.length;

                },
                0
            );

        songCount.textContent =
            songs;
    }

    if (playlistCount) {
        playlistCount.textContent =
            playlists.length;
    }

    if (historyCount) {
        historyCount.textContent =
            history.length;
    }
}


function loadProfile() {

    const profileName =
        document.getElementById(
            "profileName"
        );

    if (!profileName) {
        return;
    }

    const profileEmail =
        document.getElementById(
            "profileEmail"
        );

    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );

    if (!currentUser) {

        profileName.textContent =
            "Гость";

        if (profileEmail) {
            profileEmail.textContent =
                "Создай аккаунт, чтобы сохранять свою музыку";
        }

        if (profileAvatar) {
            profileAvatar.src =
                getDefaultAvatar();
        }

        updateProfileStats();

        return;
    }

    profileName.textContent =
        currentUser.name;

    if (profileEmail) {
        profileEmail.textContent =
            currentUser.email;
    }

    if (profileAvatar) {
        profileAvatar.src =
            currentUser.avatar ||
            getDefaultAvatar();
    }

    const profileNameInput =
        document.getElementById(
            "profileNameInput"
        );

    if (profileNameInput) {
        profileNameInput.value =
            currentUser.name;
    }

    renderHistory(
        "profileHistory"
    );

    const profilePlaylists =
        document.getElementById(
            "profilePlaylists"
        );

    if (profilePlaylists) {

        if (playlists.length === 0) {

            profilePlaylists.innerHTML = `
                <div class="empty-state">

                    <div>＋</div>

                    <h3>
                        Плейлистов пока нет
                    </h3>

                    <p>
                        Создай свой первый плейлист.
                    </p>

                </div>
            `;

        } else {

            profilePlaylists.innerHTML =
                playlists
                    .slice(0, 4)
                    .map(
                        playlist => {

                            return `
                                <div class="playlist-card">

                                    <img
                                        class="playlist-cover"
                                        src="${playlist.cover || createPlaylistCover()}"
                                        alt=""
                                    >

                                    <h3>
                                        ${escapeHTML(
                                            playlist.name
                                        )}
                                    </h3>

                                    <p>
                                        ${playlist.songs.length}
                                        песен
                                    </p>

                                </div>
                            `;
                        }
                    )
                    .join("");
        }
    }

    updateProfileStats();
}


/* =========================
   EDIT PROFILE
========================= */

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );

if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        function() {

            if (!currentUser) {

                window.location.href =
                    "login.html";

                return;
            }

            const modal =
                document.getElementById(
                    "profileModal"
                );

            if (modal) {
                modal.classList.add("show");
            }
        }
    );
}


const closeProfileModal =
    document.getElementById(
        "closeProfileModal"
    );

if (closeProfileModal) {

    closeProfileModal.addEventListener(
        "click",
        function() {

            const modal =
                document.getElementById(
                    "profileModal"
                );

            if (modal) {
                modal.classList.remove(
                    "show"
                );
            }
        }
    );
}


const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );

if (saveProfileButton) {

    saveProfileButton.addEventListener(
        "click",
        function() {

            if (!currentUser) {
                return;
            }

            const input =
                document.getElementById(
                    "profileNameInput"
                );

            if (!input) {
                return;
            }

            const newName =
                input.value.trim();

            if (!newName) {
                return;
            }

            currentUser.name =
                newName;

            saveData();

            loadProfile();
            updateHeader();

            const modal =
                document.getElementById(
                    "profileModal"
                );

            if (modal) {
                modal.classList.remove(
                    "show"
                );
            }

            showMessage(
                "Профиль обновлён"
            );
        }
    );
}


/* =========================
   AVATAR
========================= */

const avatarInput =
    document.getElementById(
        "avatarInput"
    );

if (avatarInput) {

    avatarInput.addEventListener(
        "change",
        function() {

            if (!currentUser) {

                showMessage(
                    "Сначала войди в аккаунт"
                );

                return;
            }

            const file =
                avatarInput.files[0];

            if (!file) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                function(event) {

                    currentUser.avatar =
                        event.target.result;

                    saveData();

                    loadProfile();

                    showMessage(
                        "Аватар изменён"
                    );
                };

            reader.readAsDataURL(file);
        }
    );
}


/* =========================
   LOGOUT
========================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function() {

            localStorage.removeItem(
                "vibeUser"
            );

            currentUser = null;

            updateHeader();

            window.location.href =
                "home.html";
        }
    );
}


/* =========================
   LOGIN
========================= */

const loginForm =
    document.getElementById(
        "loginForm"
    );

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();

            const password =
                document.getElementById(
                    "loginPassword"
                ).value;

            const accounts =
                JSON.parse(
                    localStorage.getItem(
                        "vibeAccounts"
                    )
                ) || [];

            const account =
                accounts.find(
                    user =>
                        user.email === email &&
                        user.password === password
                );

            if (!account) {

                showMessage(
                    "Неверный email или пароль"
                );

                return;
            }

            currentUser = {

                name: account.name,

                email: account.email,

                avatar:
                    account.avatar || null
            };

            saveData();

            showMessage(
                "Добро пожаловать!"
            );

            setTimeout(
                function() {

                    window.location.href =
                        "profile.html";

                },
                500
            );
        }
    );
}


/* =========================
   REGISTER
========================= */

const registerForm =
    document.getElementById(
        "registerForm"
    );

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const name =
                document.getElementById(
                    "registerName"
                ).value.trim();

            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();

            const password =
                document.getElementById(
                    "registerPassword"
                ).value;

            if (!name || !email || !password) {

                showMessage(
                    "Заполни все поля"
                );

                return;
            }

            if (password.length < 6) {

                showMessage(
                    "Пароль должен содержать минимум 6 символов"
                );

                return;
            }

            const accounts =
                JSON.parse(
                    localStorage.getItem(
                        "vibeAccounts"
                    )
                ) || [];

            const exists =
                accounts.some(
                    account =>
                        account.email === email
                );

            if (exists) {

                showMessage(
                    "Такой аккаунт уже существует"
                );

                return;
            }

            const account = {

                name: name,

                email: email,

                password: password,

                avatar: null
            };

            accounts.push(account);

            localStorage.setItem(
                "vibeAccounts",
                JSON.stringify(accounts)
            );

            currentUser = {

                name: name,

                email: email,

                avatar: null
            };

            saveData();

            showMessage(
                "Аккаунт создан!"
            );

            setTimeout(
                function() {

                    window.location.href =
                        "profile.html";

                },
                500
            );
        }
    );
}


/* =========================
   START
========================= */

updateHeader();

renderPlaylists();

renderHistory(
    "historyList"
);

loadProfile();

updateProfileStats();