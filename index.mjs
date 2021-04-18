import { XXHash128 } from 'xxhash-addon'
import dic from './dictionary.js'
import phrases from './phrases.js'

const hasher = new XXHash128()

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'pink', 'purple', 'black', 'white', 'brown']
const modifiers = ['extra big', 'extra small', 'glows in the dark', 'glittery', 'object inside', 'round', 'foam', 'fuzzy', 'metal', 'wood']
const special_faces = ['highest number', 'lowest number', 'even number', 'odd number', 'nothing', 'word', 'phrase', 'emoji', '+', '-']

const face_counts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 24, 30, 34, 48, 50, 60, 100, 120]

/** if anything rolls a second time, it uses the base, adds the first number of the hash, then uses that. If its the third time it uses the second integer. So on and so on. **/
const dice_data = {}
const msg = 'Hello World'
dice_data.hash = hasher.hash(Buffer.from(msg, 'utf8')).toString('hex')
dice_data.lottery = dice_data.hash.substring(22, 24)
// if(claimed(lottery)) return
dice_data.face_count = dice_data.hash.substring(0, 2)
dice_data.color = dice_data.hash.substring(2, 4)
dice_data.modifier = dice_data.hash.substring(4, 6)
dice_data.special_face = dice_data.hash.substring(6, 8)
dice_data.emoji = dice_data.hash.substring(8, 11)
dice_data.word = dice_data.hash.substring(11, 15)
dice_data.phrase = dice_data.hash.substring(15, 18)
dice_data.min = dice_data.hash.substring(18, 20)
dice_data.max = dice_data.hash.substring(20, 22)
console.table(dice_data)
