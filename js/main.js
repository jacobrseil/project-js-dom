/* SECTION HEADERS:
-----"Initialize"
-----"Go Home"
-----"Open New Gallery"
-----"Navigate Catalogue"
-----"Adjust Theme and Mood"
*/
const root = document.documentElement;
const gallery = document.querySelector('.gallery');
const banner = document.querySelector('.banner');
const itemCatalogue = document.querySelector('.item-catalogue');
const galleryLinks = document.querySelectorAll('.gallery-link');

let systemBusy = false;
let windowResizing = false;
let galleryName = '';
let galleryItems = [];
let catalogueIndex = 0;
let catalogueItemLimit = Math.floor((window.innerWidth * 0.8) / 120);

//timeouts
function sleep(ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
}

async function limitUserActions(ms) {
   systemBusy = true;
   await sleep(ms);
   systemBusy = false;
}

function getJsonData(input) {
   return input.then((data) => data.json());
}

function endOfAnimation(element) {
   return new Promise(resolve => {
      element.onanimationend = () => resolve();
   })
}

function endOfTransition(element) {
   return new Promise(resolve => {
      element.ontransitionend = () => resolve();
   })
}

//misc management
function removeChildren(parent, numToRemove = parent.childElementCount, index = parent.childElementCount - 1) {
   while (numToRemove > 0, numToRemove--) {
      parent.childNodes[index].remove();
      if (index !== 0) { index--; }
   }
}

function removeLinkHighlight() {
   for (const link of galleryLinks) {
      link.classList.remove('highlighted');
   }
}

//catalogue controls
async function selectCatalogueItem(catalogueItem) {
   const itemName = catalogueItem.dataset.name;
   const itemData = fetch(`https://api.genshin.dev/${galleryName}/${itemName}`);
   const previousSelection = document.querySelector('.selected');

   if (previousSelection) { previousSelection.classList.remove('selected'); }
   catalogueItem.classList.add('selected');

   await getJsonData(itemData).then((data) => console.log(data));
}

function updateCatalogueIndex() {
   catalogueIndex = galleryItems.indexOf(itemCatalogue.lastChild.dataset.name) + 1;
}

function populateCatalogue(referenceNode = null, specifiedCount = null) {
   let start = catalogueIndex;
   let end = start + catalogueItemLimit;
   
   if (referenceNode) {
      const inverseIndex = catalogueIndex - catalogueItemLimit * 2;
      start = inverseIndex >= 0 ? inverseIndex : 0;
      end = inverseIndex >= 0 ? start + catalogueItemLimit : inverseIndex + catalogueItemLimit;
   }

   if (specifiedCount) {
      end = start + specifiedCount;
   }

   for (const itemName of galleryItems.slice(start, end)) {
      const catalogueItem = itemCatalogue.insertBefore(document.createElement('li'), referenceNode);
      const itemImage = catalogueItem.appendChild(document.createElement('img'));

      catalogueItem.dataset.name = itemName;
      itemImage.setAttribute('src', `https://api.genshin.dev/${galleryName}/${itemName}/icon`);
      catalogueItem.addEventListener('click', async function() {
         selectCatalogueItem(this);
      })
   }
   updateCatalogueIndex();
}

function setCatalogueWidth(itemLimit) {
   root.style.setProperty('--catalogue-width', `${itemLimit * 120}px`);
}

function resizeCatalogue() {
   if (!itemCatalogue.firstChild) { return; }

   const newItemLimit = Math.floor((window.innerWidth * 0.8) / 120);
   const difference = Math.abs(catalogueItemLimit - newItemLimit);

   if (!difference) { return; }

   if (newItemLimit < catalogueItemLimit) {
      removeChildren(itemCatalogue, difference);
      updateCatalogueIndex();
   } else { populateCatalogue(null, difference); }

   setCatalogueWidth(newItemLimit);
   catalogueItemLimit = newItemLimit;
}

// ----------
// Initialize
// ----------
setCatalogueWidth(catalogueItemLimit);

window.onresize = () => {
   clearTimeout(windowResizing);
   windowResizing = setTimeout(resizeCatalogue, 250);
}

// -------
// Go Home
// -------
document.querySelector('.logo').addEventListener('click', async function() {
   if (systemBusy) { return; }
   limitUserActions(1000);

   removeLinkHighlight();
   gallery.style.opacity = '0';
   await sleep(500);
   gallery.style.display = 'none';
   banner.style.opacity = '1';
})

// ----------------
// Open New Gallery
// ----------------
for (const link of galleryLinks) {
   link.addEventListener('click', async function() {
      if (systemBusy) { return; }
      limitUserActions(1000);

      galleryName = this.dataset.name;
      const catalogueData = fetch(`https://api.genshin.dev/${galleryName}`);
      const toRemove = [
         'aloy',
         'ayato',
         'collei',
         'defense-mechanism',
         'eye-of-the-storm',
         'fatui-skirmisher',
         'hilichurl-shooter',
         'kuki-shinobu',
         'shikanoin-heizou',
         'the-great-snowboar-king',
         'tighnari',
         'traveler-anemo',
         'traveler-dendro',
         'traveler-electro',
         'traveler-geo'
      ]; //these items from the api are either redundant or lacking vital data

      //prep display
      removeLinkHighlight();
      link.classList.add('highlighted');
      banner.style.opacity = '0';
      gallery.style.opacity = '0';
      gallery.style.display = 'flex';
      await sleep(500);

      //reset gallery
      removeChildren(itemCatalogue);
      catalogueIndex = 0;

      //assign filtered api data
      await getJsonData(catalogueData)
         .then((data) => galleryItems = data.filter(itemName => !toRemove.includes(itemName)));

      //populate initial catalogue items
      populateCatalogue();
      selectCatalogueItem(itemCatalogue.firstChild);

      gallery.style.opacity = '1';
   })
}

// ------------------
// Navigate Catalogue
// ------------------
const catalogueIndexers = document.querySelectorAll('[data-direction]');

for (const indexer of catalogueIndexers) {
   indexer.addEventListener('click', async function() {
      if (systemBusy) { return; }
      limitUserActions(1000);

      const direction = this.dataset.direction;
      const referenceNode = direction === 'back' ? itemCatalogue.firstChild : null;
      let totalItems = 0;
      let itemsAdded = 0;
      let referenceIndex = 0;

      //add items to catalogue
      populateCatalogue(referenceNode);

      //assign CSS animation parameters
      totalItems = itemCatalogue.childElementCount;
      itemsAdded = totalItems - catalogueItemLimit;
      root.style.setProperty('--animation-distance', `-${itemsAdded * 120}px`);

      //animate catalogue
      itemCatalogue.dataset.animation = direction === 'back' ? 'back' : 'forward';

      //wait for animation to finish and reset data attribute
      await endOfAnimation(itemCatalogue);
      delete itemCatalogue.dataset.animation;

      //remove number of items added from opposite end of catalogue
      if (direction === 'back') { referenceIndex = totalItems - 1; }
      removeChildren(itemCatalogue, itemsAdded, referenceIndex)
      updateCatalogueIndex();
   })
}

// ---------------------
// Adjust Theme and Mood
// ---------------------
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

//duct-tape fix for lack of transition functionality with background-image gradients
async function peekABooGradient() {
   for(const indexer of catalogueIndexers) {
      delete indexer.dataset.gradient;
   }
   await endOfTransition(document.body);
   for(const indexer of catalogueIndexers) {
      indexer.dataset.gradient = '';
   }
}

//user controls
for (const element of themeElements) {
   element.addEventListener('click', function() {
      if (systemBusy) { return; }
      limitUserActions(500);

      root.dataset.theme = this.dataset.theme;
      let theme = getTheme('-base');
      setTheme(theme);
      if (root.dataset.mood === 'dim') {
         toggleMood();
      }
      peekABooGradient();
   })
}

document.querySelector('.lightbulb').addEventListener('click', function() {
   if (systemBusy) { return; }
   limitUserActions(500);

   toggleMood();
   peekABooGradient();
   root.dataset.mood = root.dataset.mood === 'bright' ? 'dim' : 'bright';
})

document.querySelector('.theme-tab').addEventListener('click', function() {
   if (systemBusy) { return; }
   limitUserActions(500);

   const themePanel = this.parentElement;
   themePanel.style.left = themePanel.style.left === '-80px' ? '-5px' : '-80px';
   this.style.transform = this.style.transform === 'rotate(0deg)' ? 'rotate(60deg)' : 'rotate(0deg)';
})