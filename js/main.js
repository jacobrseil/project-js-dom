/* SECTION HEADERS:
-----"Go Home"
-----"Open New Gallery"
-----"Adjust Theme and Mood"
*/

const gallery = document.querySelector('.gallery');
const banner = document.querySelector('.banner');
const itemCatalogue = document.querySelector('.item-catalogue');
const galleryLinks = document.querySelectorAll('.gallery-link');

let galleryName = '';
let galleryItems = [];
let catalogueItemIndex = 0;
let catalogueItemLimit = 9; //placeholder; make dynamic with css variable & media query

function sleep(ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
}

function removeLinkHighlight() {
   for (const link of galleryLinks) {
      link.classList.remove('highlighted');
   }
}

function removeChildren(parent) {
   while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
   }
}

function getJsonData(input) {
   return input.then((data) => data.json());
}

function updateCatalogueItemIndex() {
   catalogueItemIndex = galleryItems.indexOf(itemCatalogue.lastChild.dataset.name) + 1;
}

function populateCatalogue(referenceNode = null) {
   const start = referenceNode === null
      ? catalogueItemIndex
      : catalogueItemIndex - catalogueItemLimit * 2;
   const end = start + catalogueItemLimit;

   for (const item of galleryItems.slice(start, end)) {
      const catalogueItem = itemCatalogue.insertBefore(document.createElement('li'), referenceNode);
      const itemImage = catalogueItem.appendChild(document.createElement('img'));

      catalogueItem.dataset.name = item;
      itemImage.setAttribute('src', `https://api.genshin.dev/${galleryName}/${item}/icon`);
   }

   updateCatalogueItemIndex();
}

// -------
// Go Home
// -------
document.querySelector('.logo').addEventListener('click', async function() {
   removeLinkHighlight();
   gallery.style.opacity = '0';
   await sleep(1000);
   banner.style.opacity = '1';
})

// ----------------
// Open New Gallery
// ----------------
for (const link of galleryLinks) {
   link.addEventListener('click', async function() {
      galleryName = this.dataset.name;
      const catalogueData = fetch(`https://api.genshin.dev/${galleryName}`);
      const toRemove = [
         'collei',
         'kuki-shinobu',
         'shikanoin-heizou',
         'tighnari',
         'traveler-anemo',
         'traveler-cryo',
         'traveler-dendro',
         'traveler-electro',-
         'traveler-geo',
         'traveler-hydro',
         'traveler-pyro'
      ]; //these items from the api are either redundant or lacking vital data

      //prep display
      removeLinkHighlight();
      link.classList.add('highlighted');
      banner.style.opacity = '0';
      gallery.style.opacity = '0';
      await sleep(1000);

      //reset gallery
      removeChildren(itemCatalogue);
      catalogueItemIndex = 0;

      //assign filtered api data
      await getJsonData(catalogueData)
         .then((data) => galleryItems = data.filter(item => !toRemove.includes(item)));

      //populate initial catalogue html
      populateCatalogue();

      gallery.style.opacity = '1';
   })
}

// ---------------------
// Adjust Theme and Mood
// ---------------------
const root = document.documentElement;
const themeElements = document.querySelectorAll('.theme-icon');
const colorTypes = ['theme', 'accent', 'text', 'main'];

function getTheme(base = '') {
   let theme = [];
   for (const type of colorTypes) {
      theme.push(getComputedStyle(root).getPropertyValue(`--color-${type}${base}`));
   }
   return theme;
}

function setTheme(theme) {
   for (const type of colorTypes) {
      root.style.setProperty(`--color-${type}`, theme.shift());
   }
}

function toggleMood() {
   const [colorTheme, colorAccent, colorText, colorMain] = getTheme();
   setTheme([colorAccent, colorTheme, colorMain, colorText]);
}

//user controls
for (const element of themeElements) {
   element.addEventListener('click', function() {
      root.dataset.theme = this.dataset.theme;
      let theme = getTheme('-base');
      setTheme(theme);
      if (root.dataset.mood === "dim") {
         toggleMood();
      }
   })
}

document.querySelector('.lightbulb').addEventListener('click', function() {
   toggleMood();
   root.dataset.mood = root.dataset.mood === "bright" ? "dim" : "bright";
})

document.querySelector('.theme-tab').addEventListener('click', function() {
   const themePanel = this.parentElement;
   themePanel.style.left = themePanel.style.left === '-80px' ? '-5px' : '-80px';
   this.style.transform = this.style.transform === 'rotate(0deg)' ? 'rotate(60deg)' : 'rotate(0deg)';
})
