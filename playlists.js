const modal = document.getElementById("playlistModal");
const createButton = document.getElementById("createPlaylistButton");
const closeModal = document.getElementById("closeModal");
const saveButton = document.getElementById("savePlaylistButton");

createButton.addEventListener("click", async () => {

    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    modal.classList.add("show");
});

closeModal.addEventListener("click", () => {
    modal.classList.remove("show");
});

modal.addEventListener("click", (event) => {

    if (event.target === modal) {
        modal.classList.remove("show");
    }

});

saveButton.addEventListener("click", async () => {

    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const name = document.getElementById("playlistName").value.trim();
    const cover = document.getElementById("playlistCover").value.trim();

    if (!name) {
        return;
    }

    const { error } = await supabaseClient
        .from("playlists")
        .insert({
            user_id: user.id,
            name: name,
            cover: cover
        });

    if (error) {
        alert(error.message);
        return;
    }

    document.getElementById("playlistName").value = "";
    document.getElementById("playlistCover").value = "";

    modal.classList.remove("show");

    loadPlaylists();
});

async function loadPlaylists() {

    const user = await getCurrentUser();
    const container = document.getElementById("playlistsContainer");

    if (!user) {

        container.innerHTML = `
            <div class="empty-playlists">
                <h2>Your playlists are waiting.</h2>
                <p>Log in to create and save your playlists.</p>
                <a href="login.html" class="main-button">LOG IN</a>
            </div>
        `;

        return;
    }

    const { data, error } = await supabaseClient
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = `
            <div class="empty-message">
                Could not load playlists.
            </div>
        `;
        return;
    }

    if (!data || data.length === 0) {

        container.innerHTML = `
            <div class="empty-playlists">
                <h2>No playlists yet.</h2>
                <p>Create your first playlist.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    data.forEach(playlist => {

        const card = document.createElement("article");

        card.className = "playlist-card";

        const cover =
            playlist.cover ||
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80";

        card.innerHTML = `
            <div class="playlist-cover">
                <img src="${cover}" alt="">
            </div>

            <div class="playlist-info">
                <h3>${escapePlaylist(playlist.name)}</h3>
                <p>YOUR PLAYLIST</p>

                <button class="delete-playlist">
                    DELETE
                </button>
            </div>
        `;

        card.querySelector(".delete-playlist")
            .addEventListener("click", async () => {

                const confirmDelete =
                    confirm("Delete this playlist?");

                if (!confirmDelete) {
                    return;
                }

                await supabaseClient
                    .from("playlists")
                    .delete()
                    .eq("id", playlist.id);

                loadPlaylists();
            });

        container.appendChild(card);
    });
}

function escapePlaylist(text) {

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadPlaylists();