import { XXHash128 } from 'xxhash-addon'
import dic from './dictionary.js'
import phrases from './phrases.js'
import emojis from './emoji.js'
import Discord from 'discord.js'
import PouchDb from 'pouchdb-node'
import PouchDbMemory from 'pouchdb-adapter-memory'
import PouchDbFind from 'pouchdb-find'
import Haikunator from 'haikunator'
import express from 'express'
import cuid from 'cuid'
import cors from 'cors'

PouchDb.plugin(PouchDbFind)
PouchDb.plugin(PouchDbMemory)
const app = express()
app.use(cors())
app.set('view engine', 'pug')
app.use('/static', express.static('static'))

const isDev = process.env.NODE_ENV === 'dev'
if (isDev) console.log('Development Mode')

const client = new Discord.Client()
const hasher = new XXHash128()
const guildDatas = new PouchDb(
  'db/guildData',
  isDev ? { adapter: 'memory' } : null
)
const diceBags = new PouchDb(
  'db/diceBags',
  isDev ? { adapter: 'memory' } : null
)

const haiku = new Haikunator({
  defaults: { tokenLength: 0, delimiter: ' ' }
})
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

async function diceExists (guild, hash, set) {
  const number = parseInt(hash.substring(0, 2), 16)
  const res = await diceBags.find({
    selector: { number, guild, set }
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
  diceData.notes = []
  diceData.name = haiku.haikunate()

  if (diceData.faceCount === 0) {
    diceData.specialType = 'invisible'
    diceData.faces[0] = ' '
    return diceData
  }

  if (diceData.faceCount === 1) {
    diceData.specialType = 'not a dice'
    diceData.notes.push(`It is actually a ${faceCalcs.symbols(0)}!`)
    return diceData
  }
  if (diceData.gimmick === 'glows in the dark') {
    diceData.notes.push(`It glows ${colors[indexes.get(5) % colors.length]}!`)
  }
  if (diceData.gimmick === 'glitters') {
    diceData.notes.push(
      `It glitters ${colors[indexes.get(5) % colors.length]}!`
    )
  }
  if (diceData.gimmick === 'object inside') {
    diceData.notes.push(`The object inside is a ${faceCalcs.symbols(0)}!`)
  }

  for (let i = 0; i < diceData.faceCount; i++) {
    diceData.faces[i] = faceCalcs[diceData.specialType](i)
  }

  return diceData
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

async function processJoinGuild (guild) {
  const salt = isDev
    ? ''
    : hasher.hash(Buffer.from(`${Math.random()}`, 'utf8')).toString('hex')
  guildDatas.put({
    _id: guild.id,
    salt: salt,
    name: haiku.haikunate(),
    set: 1
  })
}

client.on('guildCreate', processJoinGuild)

async function processMsg (msg) {
  if (msg.author.bot) return

  const guildData = await guildDatas.get(msg.guild.id)
  const { set, salt, lastWinner, lastMessenger } = guildData
  // if (msg.author.id === lastMessenger) return
  // guildData.lastMessenger = msg.author.id
  // guildData = await globals.put(guildData)

  //if (msg.author.id === lastWinner) return

  const hash = hasher
    .hash(Buffer.from(msg.content + salt, 'utf8'))
    .toString('hex')

  //if (hash.charAt(6) !== hash.charAt(9)) return

  const diceDoesExist = await diceExists(msg.guild.id, hash, set)
  if (diceDoesExist) return

  const diceData = getDiceData(hash)
  diceData.owner = msg.member.id
  diceData.author = msg.member.id
  diceData.set = set
  diceData.series = msg.guild.id
  diceData._id = cuid.slug()

  guildData.lastWinner = msg.author.id

  await diceBags.put(diceData)
  await guildDatas.put(guildData)

  return msg.reply('You won!')
}

client.on('message', processMsg)

if (isDev) {
  await processJoinGuild({ id: '1' })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'Hello World',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'Hello Moon',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'Minty Tech',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'Merry Mancer Games',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'WaveDasher Was Here',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'One',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'Two',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'Three',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'Four',
    reply: console.log
  })
  await processMsg({
    author: { id: '1' },
    member: { id: '1' },
    guild: { id: '1' },
    content: 'Five',
    reply: console.log
  })
}

// Display a list of a user's guilds with information about the guild such as last winner. Only usable while logged in and only shows the user their own guilds.
app.get('/guilds/', async (req, res) => {
  const guild = await guildDatas.get(req.params.id)
  return res.render('guild/list', { guild })
})

// Display information about a guild such as last winner, and act as a larger dice gallery
app.get('/guilds/:id', async (req, res) => {
  const guild = await guildDatas.get(req.params.id)
  return res.render('guild/view', { guild })
})

// Display detailed information about a specific dice belonging to a user
app.get('/dicebags/:profile/:id', async (req, res) => {
  const dice = await diceBags.get(req.params.id)
  if (dice.owner !== req.params.profile) {
    return res.redirect(`/dicebags/${dice.owner}/${req.params.id}`)
  }
  return res.render('dice/view', { dice })
})

// Display list of all dice with shortened information
app.get('/dicebags/:profile', async (req, res) => {
  const dice = await diceBags.find({
    selector: {
      owner: req.params.profile
    }
  })
  return res.render('dice/list', { dice })
})

app.get('/', (req, res) => {
  return res.render('welcome')
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(error.status || 500).render('error', { error })
})

client.login(process.env.DISCORD_TOKEN)
app.listen(3000, () => {
  console.log('Running website on 3000')
})
