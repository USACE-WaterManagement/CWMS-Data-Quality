// See: https://github.com/terser/terser/issues/544
// To run use node minify
var Terser = require("terser");
var fs = require("fs");
var path = require("path");
const appDir = path.dirname(require.main.filename);
const process = require('process');
function getAllFiles(dirPath, arrayOfFiles) {
    let files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        }
        else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles.filter(path => path.match(/\.js$/));
}
function minifyFiles(filePaths) {
    filePaths.forEach(async (filePath) => {
        if (filePath.indexOf(".min") == -1) {
            console.log('fp', filePath);
            fs.writeFileSync(filePath.replace(".js", ".min.js"), await Terser.minify(fs.readFileSync(filePath, "utf8")).then(d => d.code));
        }
    });
}
function main() {
    console.log(appDir);
    // Move up to the root of the project
    process.chdir("../..");
    console.log("Running from:", process.cwd());
    // Read all JS files in dist
    const files = getAllFiles(`dist`);
    minifyFiles(files);
}
main();
export {};
