// global.d.ts

// This tells TypeScript: "Whenever you see an import ending in .css?inline, 
// treat it as a string of text. Do not throw an error."
declare module '*.css?inline' {
    const content: string;
    export default content;
}