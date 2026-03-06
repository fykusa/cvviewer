/// <reference types="vite/client" />

// Build version injected by vite.config.ts build-counter plugin
declare const __APP_VERSION__: string;

// Declare CSS module imports so TypeScript doesn't complain
declare module '*.css' {
    const content: Record<string, string>;
    export default content;
}
