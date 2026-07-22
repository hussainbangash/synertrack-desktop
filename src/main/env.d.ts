// electron-vite resolves `?asset` imports to the on-disk path of a bundled file.
declare module "*?asset" {
  const assetPath: string;
  export default assetPath;
}
