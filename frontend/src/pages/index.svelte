<script>
    import { metatags } from '@roxi/routify'
    import axios from 'axios'
import { dataset_dev } from 'svelte/internal'
    metatags.title = 'Dice Bags - Home'
    metatags.description = 'Welcome to Dice Bags!'

    const diceList = (async ()=> await axios.get('//localhost:3000/api/dicebags/penis'))()
</script>

Hi

{#await diceList}
    Loading dice...
    {:then data}
        {#each data.data as cardData}
            <sl-card>
                <p>**Face Count** {cardData.faceCount}</p>
                <p>**hash** {cardData.hash}</p>
                <p>Series {cardData.series} #{cardData.number}</p>
            </sl-card>
        {/each}
    {:catch error}
        Something went wrong
{/await}