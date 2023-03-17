import QualityTx from "../index.mjs"

let qualities = [5, 101, 2433, 2689, 2204083365]

const qtx = new QualityTx()
console.log(5, qtx.getStringDescription(16777219), "\n=================")

for (const q of qualities) {
    // console.log(q, qtx.getStringDescription(q), "\n=================")
    // TODO: Range is off
    console.log(q, qtx.getStringDescription(q, true), "\n=================")
}

console.log(0, qtx.getStringDescription(0, true), "\n=================")