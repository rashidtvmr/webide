import { createClient } from "@supabase/supabase-js";
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
    if (!supabaseInstance) {
        supabaseInstance = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
        );
    }
    return supabaseInstance;
}

export async function getGithubToken(code: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke(
        "github-secret-getter",
        {
            body: { code },
        },
    );

    if (error) {
        throw new Error(`Failed to get GitHub token: ${error.message}`);
    }

    return data;
}
