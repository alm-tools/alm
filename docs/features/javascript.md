# JavaScript support

The JavaScript support is just as good as the TypeScript support, because TypeScript loves JavaScript. The best way to use in a JavaScript project is to create a `tsconfig.json` with `allowJs` set to true:

```json
{
  "compilerOptions": {
    "allowJs": true,
    "outDir": "./dist"
  }
}
```

> Note: `outDir` is required with `allowJs` because you don't want to overwrite your JS source by mistake 🌹.
