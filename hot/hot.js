import items from './hot.json' with { type: 'json' };

const hotSection = document.getElementById('hot-container');

const htmlContent = items.map(item => `
  <section class="hot hot-${item.type}">
    <h3>${item.name}</h3>
    <p id="shu">SHU: ${item.shu}</p>
  </section>
`).join('');

hotSection.innerHTML = htmlContent;
