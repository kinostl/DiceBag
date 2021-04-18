const words = require('an-array-of-english-words')
const debug = require('debug')('timer')
const { XXHash128 } = require('xxhash-addon')

debug('start program')
const buckets={}
const hasher = new XXHash128()

for(const word of words){
	const true_hash=hasher.hash(Buffer.from(word,'utf8')).toString('hex')
	/*
	const hash = true_hash.substr(0,1)
	if(!buckets[hash]){
		//console.log(true_hash)
		buckets[hash]=[]
	}
	buckets[hash].push(word)
	*/
}

/*
for(const bucket in buckets){
	console.log(`${bucket} count - ${buckets[bucket].length}`)
}

console.log(`bucket count - ${Object.keys(buckets).length}`)
*/
debug('end program')
