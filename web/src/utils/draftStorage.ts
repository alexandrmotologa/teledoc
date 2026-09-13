export interface DraftPageData {
  id: string;
  rawImageSrc: string;
  rotation: number;
}

export interface DraftSession {
  savedAt: number;
  pages: DraftPageData[];
}

const STORAGE_KEY = 'teledoc_scanner_draft_v1';

export function saveDraftSession(pages: DraftPageData[]): void {
  try {
    if (!pages || pages.length === 0) {
      clearDraftSession();
      return;
    }

    const session: DraftSession = {
      savedAt: Date.now(),
      pages,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    // QuotaExceededError safety for massive images
    console.warn('Could not save draft session to localStorage:', err);
  }
}

export function loadDraftSession(): DraftSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as DraftSession;
    // Discard drafts older than 24 hours
    if (Date.now() - session.savedAt > 24 * 60 * 60 * 1000) {
      clearDraftSession();
      return null;
    }

    if (!Array.isArray(session.pages) || session.pages.length === 0) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function clearDraftSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
