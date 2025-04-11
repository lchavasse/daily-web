declare module 'vite-plugin-raw' {
  interface PluginOptions {
    fileRegex?: RegExp;
  }
  
  export function plugin(options?: PluginOptions): any;
} 