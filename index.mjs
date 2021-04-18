import { XXHash128 } from 'xxhash-addon'
import dic from './dictionary.js'
import phrases from './phrases.js'

const hasher = new XXHash128()

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'pink', 'purple', 'black', 'white', 'brown']
const modifiers = ['extra big', 'extra small', 'glows in the dark', 'glittery', 'object inside', 'round', 'foam', 'fuzzy', 'metal', 'wood']
const special_faces = ['highest number', 'lowest number', 'even number', 'odd number', 'nothing', 'word', 'phrase', 'emoji', '+', '-']

const face_counts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 24, 30, 34, 48, 50, 60, 100, 120]

/** if anything rolls a second time, it uses the base, adds the first number of the hash, then uses that. If its the third time it uses the second integer. So on and so on. **/
const diceData = {}
const msg = 'Hello World'
diceData.hash = hasher.hash(Buffer.from(msg, 'utf8')).toString('hex')
diceData.lottery = parseInt(diceData.hash.substring(22, 24), 16)
// if(claimed(lottery),16)) return
diceData.face_count = parseInt(diceData.hash.substring(0, 2), 16)
diceData.color = parseInt(diceData.hash.substring(2, 4), 16)
diceData.modifier = parseInt(diceData.hash.substring(4, 6), 16)
diceData.special_face = parseInt(diceData.hash.substring(6, 8), 16)
diceData.emoji = parseInt(diceData.hash.substring(8, 11), 16)
diceData.word = parseInt(diceData.hash.substring(11, 15), 16)
diceData.phrase = parseInt(diceData.hash.substring(15, 18), 16)
diceData.min = parseInt(diceData.hash.substring(18, 20), 16)
diceData.max = parseInt(diceData.hash.substring(20, 22), 16)
console.table(diceData)
