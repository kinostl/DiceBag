import { XXHash128 } from 'xxhash-addon'
import dic from './dictionary.js'
import phrases from './phrases.js'
import emojis from './emoji.js'

const hasher = new XXHash128()

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'pink', 'purple', 'black', 'white', 'brown']
const modifiers = ['extra big', 'extra small', 'glows in the dark', 'glittery', 'object inside', 'round', 'foam', 'fuzzy', 'metal', 'wood']
const specialFaces = ['highest number', 'lowest number', 'even number', 'odd number', 'nothing', 'word', 'phrase', 'emoji', '+', '-']

const faceCounts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 24, 30, 34, 48, 50, 60, 100, 120]

/** if anything rolls a second time, it uses the base, adds the first number of the hash, then uses that. If its the third time it uses the second integer. So on and so on. **/
const diceData = {}
const msg = 'Hello World'
diceData.hash = hasher.hash(Buffer.from(msg, 'utf8')).toString('hex')
diceData.lottery = parseInt(diceData.hash.substring(22, 24), 16)
// if(claimed(lottery)) return
diceData.multipliers = diceData.hash.split('').map((curr) => parseInt(curr, 16))
diceData.faceCount =
  faceCounts[parseInt(diceData.hash.substring(0, 2), 16) % faceCounts.length]
diceData.color = parseInt(diceData.hash.substring(2, 4), 16) % colors.length
diceData.modifier = parseInt(diceData.hash.substring(4, 6), 16) % modifiers.length
diceData.specialFace = parseInt(diceData.hash.substring(6, 8), 16) % specialFaces.length
diceData.emoji = parseInt(diceData.hash.substring(8, 11), 16) % emojis.length
diceData.word = parseInt(diceData.hash.substring(11, 15), 16) % dic.length
diceData.phrase = parseInt(diceData.hash.substring(15, 18), 16) % phrases.length
diceData.min = parseInt(diceData.hash.substring(18, 20), 16)
diceData.max = parseInt(diceData.hash.substring(20, 22), 16)
diceData.counts = {}
const dice = {}
dice.color = colors[diceData.color]
dice.faces = []

for (let i = 0; i < diceData.faceCount; i++) {
  const face = specialFaces[diceData.specialFace]
  dice.faces.push(face)
}
console.log(diceData)
console.log(dice)
