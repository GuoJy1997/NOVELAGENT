export {};

declare global {
  interface Window {
    bixinDesktop?: {
      platform: string;
      versions: {
        chrome: string;
        electron: string;
        node: string;
      };
    };
  }
}
