import { XXHash128 } from 'xxhash-addon'
import dic from './dictionary.js'
import phrases from './phrases.js'
import emojis from './emoji.js'
import Discord from 'discord.js'
import PouchDb from 'pouchdb-node'
import cuid from 'cuid'

const client = new Discord.Client()
const hasher = new XXHash128()
const globals = new PouchDb('globals')
const dicebags = new PouchDb('dicebags')

const colors = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'pink',
  'purple',
  'black',
  'white',
  'brown'
]
const gimmicks = ['glows in the dark', 'glitters', 'object inside', 'round']
const materials = ['metal', 'wood', 'glass']
const specialTypes = ['words', 'phrases', 'fudge', 'symbols', 'pipped']
const diceSizes = ['5mm', '8mm', '12mm', '16mm', '19mm', '25mm', '50mm']
const faceCounts = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  10,
  12,
  14,
  16,
  18,
  20,
  24,
  30,
  34,
  48,
  50,
  60,
  100,
  120
]

async function diceExists (guild, hash, series) {
  const number = parseInt(hash.substring(0, 2), 16) + 255 * series
  const res = await dicebags.find({
    selector: { number, guild, series }
  })

  return res.docs.length > 0
}

function getDiceData (hash) {
  const diceData = {}
  diceData.hash = hash

  const indexes = {}
  indexes.tiny = hash.match(/.{1,1}/g).map(curr => parseInt(curr, 16)) // 16
  indexes.small = hash.match(/.{1,2}/g).map(curr => parseInt(curr, 16)) // 256
  indexes.big = hash.match(/.{1,3}/g).map(curr => parseInt(curr, 16)) // 4096
  indexes.huge = hash.match(/.{1,4}/g).map(curr => parseInt(curr, 16)) // 65536
  indexes.get = (i, size = 'tiny') => {
    if (size === 'huge') return indexes.huge[i] || indexes.get(i, 'big')
    if (size === 'big') return indexes.big[i] || indexes.get(i, 'small')
    if (size === 'small') return indexes.small[i] || indexes.get(i, 'tiny')
    if (size === 'tiny') return indexes.tiny[i] || i
  }

  diceData.number = indexes.get(0, 'small')
  diceData.faceCount = faceCounts[indexes.get(1, 'small') % faceCounts.length]

  diceData.size =
    indexes.get(0) === indexes.get(1)
      ? 'foam'
      : diceSizes[indexes.get(0)] || '16mm'
  diceData.specialType =
    indexes.get(2) === indexes.get(3)
      ? 'slurry'
      : specialTypes[indexes.get(1)] || 'pipped'
  diceData.gimmick = gimmicks[indexes.get(2)] || 'none'
  diceData.material = materials[indexes.get(3)] || 'plastic'
  diceData.color = colors[indexes.get(4) % colors.length]

  const faceCalcs = {}

  faceCalcs.pipped = i => i + 1

  faceCalcs.words = i => dic[indexes.get(i, 'huge') % dic.length]
  faceCalcs.phrases = i => phrases[indexes.get(i, 'big') % phrases.length]
  faceCalcs.fudge = i => ['-', ' ', '+'][i % 3]
  faceCalcs.symbols = i => emojis[indexes.get(i, 'huge') % emojis.length]

  faceCalcs.slurry = i => faceCalcs[specialTypes[i % specialTypes.length]](i)

  diceData.faces = []

  if (diceData.faceCount === 0) {
    diceData.specialType = 'invisible'
    diceData.faces[0] = ' '
    return diceData
  }

  if (diceData.faceCount === 1) {
    diceData.specialType = 'not a dice'
    diceData.faces[0] = ' '
    diceData.notes = `- It is actually a ${faceCalcs.symbols(0)}!\n`
    return diceData
  }
  if (diceData.gimmick === 'glows in the dark') {
    diceData.notes += `- It glows ${colors[indexes.get(5) % colors.length]}! \n`
  }
  if (diceData.gimmick === 'glitters') {
    diceData.notes += `- It glitters ${
      colors[indexes.get(5) % colors.length]
    }! \n`
  }
  if (diceData.gimmick === 'object inside') {
    diceData.notes += `- The object inside is a ${faceCalcs.symbols(0)}! \n`
  }

  for (let i = 0; i < diceData.faceCount; i++) {
    diceData.faces[i] = faceCalcs[diceData.specialType](i)
  }
  return diceData
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('guildCreate', async guild => {
  const salt = hasher
    .hash(Buffer.from(`${Math.random()}`, 'utf8'))
    .toString('hex')
  globals.put({
    _id: guild.id,
    salt: salt,
    series: 0
  })
})

client.on('message', async msg => {
  if (msg.author.bot) return

  let guildData = await globals.get(msg.guild.id)
  const { series, salt, lastWinner, lastMessenger } = guildData
  if (msg.author.id === lastMessenger) return
  guildData.lastMessenger = msg.author.id
  guildData = await globals.put(guildData)

  if (msg.author.id === lastWinner) return

  const hash = hasher
    .hash(Buffer.from(msg.content + salt, 'utf8'))
    .toString('hex')

  if (hash.charAt(6) !== hash.charAt(9)) return

  const diceDoesExist = await diceExists(msg.guild.id, hash, series)
  if (diceDoesExist) return

  const diceData = getDiceData(hash)
  diceData.owner = msg.member.id
  diceData.series = series
  diceData.guild = msg.guild.id
  diceData._id = cuid.slug()

  guildData.lastWinner = msg.author.id

  await dicebags.put(diceData)
  await globals.put(guildData)

  return msg.reply('You won!')
})

client.login(process.env.DISCORD_TOKEN)
