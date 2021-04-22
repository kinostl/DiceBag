import { XXHash128 } from 'xxhash-addon'
import dic from './dictionary.js'
import phrases from './phrases.js'
import emojis from './emoji.js'

const hasher = new XXHash128()

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'pink', 'purple', 'black', 'white', 'brown']
const gimmicks = ['glows in the dark', 'glitters', 'object inside', 'round']
const materials = ['metal', 'wood', 'glass']
const specialTypes = ['words', 'phrases', 'fudge', 'symbols', 'none']
const diceSizes = ['5mm', '8mm', '12mm', '16mm', '19mm', '25mm', '50mm']

const faceCounts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 24, 30, 34, 48, 50, 60, 100, 120]

const msg = 'Hello World'
const hash = hasher.hash(Buffer.from(msg, 'utf8')).toString('hex')

function getLottery (hash) { return parseInt(hash.substring(0, 2), 16) }
function getDiceData (hash) {
  const diceData = {}
  diceData.hash = hash

  const indexes = {}
  indexes.tiny = hash.match(/.{1,1}/g).map((curr) => parseInt(curr, 16)) // 16
  indexes.small = hash.match(/.{1,2}/g).map((curr) => parseInt(curr, 16)) // 256
  indexes.big = hash.match(/.{1,3}/g).map((curr) => parseInt(curr, 16)) // 4096
  indexes.huge = hash.match(/.{1,4}/g).map((curr) => parseInt(curr, 16)) // 65536
  indexes.get = (i, size = 'tiny') => {
    if (size === 'huge') return indexes.huge[i] || indexes.get(i, 'big')
    if (size === 'big') return indexes.big[i] || indexes.get(i, 'small')
    if (size === 'small') return indexes.small[i] || indexes.get(i, 'tiny')
    if (size === 'tiny') return indexes.tiny[i] || i
  }

  diceData.lottery = indexes.get(0, 'small')
  diceData.faceCounts = faceCounts[indexes.get(1, 'small') % faceCounts.length]

  diceData.size = indexes.get(0) === indexes.get(1) ? 'foam' : diceSizes[indexes.get(0)] || '16mm'
  diceData.specialType = indexes.get(2) === indexes.get(3) ? 'slurry' : specialTypes[indexes.get(1)] || 'none'
  diceData.gimmick = gimmicks[indexes.get(2)] || 'none'
  diceData.material = materials[indexes.get(3)] || 'plastic'
  diceData.color = colors[indexes.get(4) % colors.length]

  const faceCalcs = {}

  faceCalcs.none = (i) => i + 1

  faceCalcs.words = (i) => dic[indexes.get(i, 'huge') % dic.length]
  faceCalcs.phrases = (i) => phrases[indexes.get(i, 'big') % phrases.length]
  faceCalcs.fudge = (i) => ['-', ' ', '+'][i % 3]
  faceCalcs.symbols = (i) => emojis[indexes.get(i, 'huge') % emojis.length]

  faceCalcs.slurry = (i) => faceCalcs[specialTypes[i % specialTypes.length]](i)

  diceData.faces = []
  for (let i = 0; i < diceData.faceCounts; i++) {
    diceData.faces[i] = faceCalcs[diceData.specialType](i)
  }
  return diceData
}
