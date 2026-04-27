// global.d.ts

// This tells TypeScript: "Whenever you see an import ending in .css?inline, 
// treat it as a string of text. Do not throw an error."
declare module '*.css?inline' {
    const content: string;
    export default content;
}

// Teach TypeScript about Vite's virtual PWA module
declare module 'virtual:pwa-register' {
    export function registerSW(options?: any): (reloadPage?: boolean) => Promise<void>;
}