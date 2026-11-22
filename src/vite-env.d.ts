/// <reference types="vite/client" />
declare module 'pdfjs-dist/build/pdf';
declare module '*.js?url' { const src: string; export default src; }
