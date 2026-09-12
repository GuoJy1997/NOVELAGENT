declare global {
  interface Window {
    noveloraDesktop?: {
      platform: string;
      versions: Record<string, string>;
      selectDirectory?: (title?: string) => Promise<string | null>;
      selectFile?: (title?: string) => Promise<string | null>;
    };
  }
}

export {};
