import { XXHash128 } from 'xxhash-addon'
import dic from './dictionary.js'
import phrases from './phrases.js'
import emojis from './emoji.js'

const hasher = new XXHash128()

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'pink', 'purple', 'black', 'white', 'brown']
const gimmicks = ['glows in the dark', 'glitters', 'object inside', 'round']
const materials = ['metal', 'wood', 'glass']
const specialTypes = ['words', 'phrases', 'fudge', 'symbols']
const diceSizes = ['5mm', '8mm', '12mm', '16mm', '19mm', '25mm', '50mm']

const faceCounts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 24, 30, 34, 48, 50, 60, 100, 120]

const diceData = {}
const msg = 'Hello World'

diceData.hash = hasher.hash(Buffer.from(msg, 'utf8')).toString('hex')

diceData.tinyIndexes = diceData.hash.match(/.{1,1}/g).map((curr) => parseInt(curr, 16))
diceData.indexes = diceData.hash.match(/.{1,2}/g).map((curr) => parseInt(curr, 16))
diceData.bigIndexes = diceData.hash.match(/.{1,3}/g).map((curr) => parseInt(curr, 16))
diceData.hugeIndexes = diceData.hash.match(/.{1,4}/g).map((curr) => parseInt(curr, 16))

diceData.lottery = diceData.indexes[0]
// if(claimed(lottery)) return

diceData.size = diceData.tinyIndexes[0] === diceData.tinyIndexes[1] ? 'foam' : diceSizes[diceData.indexes[1]] || '16mm'
diceData.specialType = diceData.tinyIndexes[2] === diceData.tinyIndexes[3] ? 'slurry' : specialTypes[diceData.bigIndexes[0]] || 'none'
diceData.gimmick = gimmicks[diceData.bigIndexes[1]] || 'none'
diceData.material = materials[diceData.bigIndexes[2]] || 'plastic'
diceData.color = colors[diceData.bigIndexes[3] % colors.length]

diceData.faceCounts = faceCounts[diceData.bigIndexes[4] % faceCounts.length]
// Step 8 Populate every face as described below.
diceData.faces = []
const faceCalcs = {}
faceCalcs.none = (i) => i + 1
faceCalcs.words = (i) => i + 1
faceCalcs.phrases = (i) => i + 1
faceCalcs.fudge = (i) => i + 1
faceCalcs.symbols = (i) => i + 1

faceCalcs.slurry = (i) => {
  const faceCalc = ['none', 'words', 'phrases', 'fudge', 'symbols']
  return faceCalcs[faceCalc[i % faceCalc.length]](i)
}
for (let i = 0; i < diceData.faceCounts; i++) {
  diceData.faces[i] = faceCalcs[diceData.specialType](i)
}

/* When a dice is a specialType every face has that specialType. The hex value will be iterated over to acquire indexes. If an index does not return a value, the index is used as the face instead - producing a number. */

/* When you totally run out of indexes, return an increasing number */

/* When you run out of indexes in a list of indexes, fall back to the smaller one. If you're already a tinyIndex, go up in size and use modulo to bring yourself back down to the proper limit. */

console.log(diceData)
