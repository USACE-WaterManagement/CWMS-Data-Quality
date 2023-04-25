## Build Tools for the CDQ Package
*`minify.cjs` uses terser and node to minify all JS files inside the `/dist` directory*

### Commands of Interest
* `node minify.cjs` - Minifies all files
* `npx --yes terser index.js -c -m -o index.min.js` - Minifies one file named index.js in your current directory