const SUPABASE_URL = "ВСТАВЬ_СЮДА_SUPABASE_URL";
const SUPABASE_KEY = "ВСТАВЬ_СЮДА_SUPABASE_PUBLISHABLE_KEY";

const YOUTUBE_API_KEY = "ВСТАВЬ_СЮДА_YOUTUBE_API_KEY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);