/// <reference types="vite/client" />

// Declare CSS module imports so TypeScript doesn't complain
declare module '*.css' {
    const content: Record<string, string>;
    export default content;
}
