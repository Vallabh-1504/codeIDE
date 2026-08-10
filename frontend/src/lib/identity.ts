const ANON_ID_KEY = "codestudio_anon_id";

export const getAnonId = (): string => {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
    return id;
};
