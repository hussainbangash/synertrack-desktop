import type { SynertrackApi } from "./index";

declare global {
  interface Window {
    synertrack: SynertrackApi;
  }
}

export {};
