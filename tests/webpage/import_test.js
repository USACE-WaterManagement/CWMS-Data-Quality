import {Quality, QualityStringRenderer} from "../../dist/index.min.js"

console.log(Quality.getBytes(5))
console.log(Quality.getInteger(new Int32Array([0, 0, 0, 5])))
console.log(Quality.getInteger(new Int32Array([1, 0, 3, 5])))
console.log(QualityStringRenderer.getString(5, 2))
console.log(QualityStringRenderer.getJSON(5))
console.log(QualityStringRenderer.getHtmlStringDescription(5))