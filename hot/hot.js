import items from 'hot.json' with { type: 'json' };

const hotSection = document.getElementById('hot')
hotSection.innerHTML = "";

items.forEach(item => {
    hotSection.innerHTML += `
    <section class="hot" class=hot-${item.type}>

    <h3>${item.name}</h3>

    <p> SHU: ${item.shu} </p>a
    </section>
    `
});