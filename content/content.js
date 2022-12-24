// Constants
const SELECTION_CHECK = /^[0-9\s\$\^\&\]\[\/\\!@#<>%*)('"{};:?|+=.,_-]+$/;
const FONTS = ['Tahoma', 'Geneva', 'Sans-Serif'];

// Options variables
var defLang, useInline, phraseSelect, inlineBehavior;

// Global variables
var dragging = false;
var keyPressed = false;

var draggableDown = false;
var offset;

var selection, selectedText, selectedLang;

var icon, inline;


window.addEventListener('DOMContentLoaded', () => {
  // Checking if script has already been injected
  if (document.getElementsByClassName('papagoExt-icon').length > 0 
    && document.getElementsByClassName('papagoExt-inline').length > 0) return;
  // console.log("0.0.0 - DOMContentLoaded & Script Injected");

  // Set default settings if none have been changed by the user yet.
  browser.storage.local.get({
    defTargetLang: null,
    defFont: 'Tahoma',
    defTheme: 'auto',
    useInline: true,
    phraseSelect: 'drag',
    inlineBehavior: 'icon',
    browserLang: 'en'
  })
  .then(config => {
    let defFont = config.defFont == 'default' ? 'Tahoma' : config.defFont;

    useInline = config.useInline;
    phraseSelect = config.phraseSelect;
    inlineBehavior = config.inlineBehavior;

    // If inline is disabled, then nothing will happen to the page
    if (useInline) {
      defLang = config.defTargetLang || config.browserLang;

      icon = createIcon();
      inline = createInline();

      document.addEventListener('mousedown', mouseDown);
      document.addEventListener('mouseup', mouseUp);
      document.addEventListener('mousemove', mouseMove);
      
      document.addEventListener('selectionchange', selectionChange);

      if (phraseSelect != 'drag') {
        document.addEventListener('keydown', keyDown);
        document.addEventListener('keyup', keyUp);
      }

      // Set font
      inline.style.fontFamily = defFont + ', ' + FONTS.join(', ');

      // Set theme 
      if (config.defTheme == 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          // Light mode
          inline.classList.add('light');
        } else {
          // Dark mode
          inline.classList.add('dark');
        }
      } else if (config.defTheme == 'light') {
        inline.classList.add('light');
      } else {
        inline.classList.add('dark');
      }
    }
  })
  .catch(err => {console.log(err)});
});

function mouseDown(event) {
  // console.log("Region [0][0] - MouseDown");
  if (icon.contains(event.target) || inline.contains(event.target)) return;

  selection = selectedText = selectedLang = null;
  hideIcon();
  hideInline();

  dragging = true;
}

function mouseUp(event) {
  // console.log("Region [0][1] - MouseUp");
  draggableDown = false;
  if (icon.contains(event.target) || inline.contains(event.target)) return;

  // If the mouseup event's intention is to deselect, this timeout allows the browser to do so
  // before continuing.
  setTimeout(() => {
    let tempSelection = window.getSelection();
    let tempText = tempSelection.toString();

    if (tempText.length > 0 && tempText.length < 500 && !SELECTION_CHECK.test(tempText)) {
      if (phraseSelect === 'drag' || keyPressed) {
        if (dragging) {
          // Selection check passed: store selection
          selection = window.getSelection();
          selectedText = selection.toString();

          // Mouse is held down. Pass showing icon/inline to mouseup event
          inlineBehavior === 'icon' ? showIcon(event) : showInline();
        } 
      }
    }

    dragging = false;
  }, 10);
}

function mouseMove(event) {
  // console.log("Region [0][2] - mouseMove");
  if (draggableDown) {
    inline.style.left = (event.clientX + offset.left) + 'px';
    inline.style.top = (event.clientY + offset.top) + 'px';
  }
}

function keyDown(event) {
  // console.log("Region [0][3] - keyDown");
  if (phraseSelect === 'alt-drag' && event.keyCode === 18) {
    keyPressed = true;
  } else if (phraseSelect === 'ctrl-drag' && event.keyCode === 17) {
    keyPressed = true;
  }
}

function keyUp(event) {
  // console.log("Region [0][4] - keyUp");
  if (phraseSelect === 'alt-drag' && event.keyCode === 18) {
    keyPressed = false;
  } else if (phraseSelect === 'ctrl-drag' && event.keyCode === 17) {
    keyPressed = false;
  }
}

function selectionChange() {
  console.log("Region [0][5] - selectionChange");
  if (window.getSelection().toString().length == 0) {
    if (icon.style.display != 'none') hideIcon();
  }
}

function createIcon() {
  console.log("Region [0][6] - createIcon");
  let container = document.createElement('div');
  container.className = 'papagoExt-icon';

  let image = document.createElement('div');
  image.style = `background-image: url(${browser.runtime.getURL('icons/19.png')}); height: 19px; width: 19px;`;

  container.appendChild(image);
  document.body.appendChild(container);

  container.addEventListener('mousedown', event => {
    event.preventDefault();
    event.stopPropagation();
  });
  container.addEventListener('click', showInline);

  return container;
}

function createInline() {
  console.log("Region [0][7] - createInline");
  let container = document.createElement('div');
  container.className = 'papagoExt-inline';

  container.innerHTML = contentHTML;
  document.body.appendChild(container);

  let target = document.getElementById('papagoExt-language-target');
  target.addEventListener('change', setResult);
  target.value = defLang;

  let copyButton = document.getElementById('papagoExt-copy-button');
  copyButton.addEventListener('click', copyText);

  let draggables = document.getElementsByClassName('papago-draggable')
  for (let i = 0; i  < draggables.length; i++) {
    draggables[i].addEventListener('mousedown', (event) => {
      if (event.target != draggables[i]) return;

      event.preventDefault();

      draggableDown = true;
      offset = {
        left: container.offsetLeft - event.clientX,
        top: container.offsetTop - event.clientY
      }
    })
  }

  // Locales
  document.getElementById('papagoExt-clara').textContent = browser.i18n.getMessage('clara');
  document.getElementById('papagoExt-matt').textContent = browser.i18n.getMessage('matt');
  document.getElementById('papagoExt-djoey').textContent = browser.i18n.getMessage('djoey');
  document.getElementById('papagoExt-danna').textContent = browser.i18n.getMessage('danna');

  copyButton.textContent = browser.i18n.getMessage('copy');
  document.getElementById('papagoExt-donate').textContent = browser.i18n.getMessage('donate');

  return container;
}

function showIcon(event) {
  console.log("Region [0][8] - showIcon");
  let rect = selection.getRangeAt(0).getBoundingClientRect();

  let offset, top, left;

  offset = event.clientY > (rect.top + rect.bottom) / 2 ? rect.bottom - 1 : rect.top + 1 - 27;
  top = offset + getPageYOffset();

  if (top < getPageYOffset()) {
    top = 5;
  } else if (top > (window.innerHeight - 27 + getPageYOffset())) {
    top = window.innerHeight - 5 - 27 + getPageYOffset();
  }

  offset = event.clientX > (rect.left + rect.right) / 2 ? -28 : 1;
  left = event.clientX + offset + getPageXOffset();

  icon.style.top = top + "px";
  icon.style.left = left + "px";
  icon.style.display = 'block';

  // Timeout can interfere with showing the icon if showIcon is called again. 
  // Not sure how to check if icon has been hidden already.
  // setTimeout(hideIcon, 20000);
}

function hideIcon() {
  console.log("Region [0][9] - hideIcon");
  icon.style.display = 'none';
}

function showInline() {
  console.log("Region [0][10] - showInline");
  hideIcon();

  setResult();

  let rect = selection.getRangeAt(0).getBoundingClientRect();

  let top = getPageYOffset();
  if ((rect.bottom + rect.top) < window.innerHeight) {
    // Selection is in the top half of screen
    top += rect.bottom + 5;
  } else {
    // Selection is in bottom half of screen.
    top += rect.top - 5 - 125;
  }

  let left = ((rect.right + rect.left) / 2) - 175 + getPageXOffset();

  // Check if inline will be off screen.
  if (left > (window.innerWidth - 350 + getPageXOffset())) {
    left = window.innerWidth - 25 - 350 + getPageXOffset();
  } else if (left < (10 + getPageXOffset())) {
    left = 10 + getPageXOffset();
  }

  inline.style.top = top + "px";
  inline.style.left = left + "px";
  inline.style.display = 'block';
}

function hideInline() {
  console.log("Region [0][11] - hideInline");
  inline.style.display = 'none';

  let result = document.getElementById('papagoExt-result-text');
  result.textContent = '';
}

// Blur and prevent clicking while showing the loading animation
function loading(bool) {
  console.log("Region [0][12.5000] - Loading");
  let blur = document.getElementById('papagoExt-blur');
  let loader = document.getElementById('papagoExt-loader');

  if (bool) {
    blur.style.filter = 'blur(1px)';
    loader.style.display = 'flex';
  } else {
    blur.style.filter = 'none';
    loader.style.display = 'none';
  }
}

function setResult() {
  console.log("Region [0][12] - setResult");
  let target = document.getElementById('papagoExt-language-target');
  let result = document.getElementById('papagoExt-result-text');

  // console.log(`[0][12] - setResult - target = ${target}`)
  // console.log(target)
  // console.log(`[0][12] - setResult - result = ${result}`)
  // console.log(result)

  // Check if source languange is known already
  if (selectedLang) {
    if (selectedLang === target.value) {
      return result.textContent = selectedText;
    }

    loading(true);

    sendTranslate(selectedLang, target.value, selectedText)
    .then(response => {
      if (response.error) throw new Error(response.message);
  
      result.textContent = response.message.result.translatedText;
  
      loading(false);
    })
    .catch(err => {
      result.textContent = err.message;
      loading(false);
    });
  } else {
    // Source language needs to be detected
    loading(true);

    sendDetect(target.value, selectedText)
    .then(response => {
      if (response.error) throw new Error(response.message);

      result.textContent = response.message.result.translatedText;
      selectedLang = response.message.result.srcLangType;

      if (response.message.result.tarLangType !== target.value) {
        target.value = response.message.result.tarLangType;
      }

      loading(false);
    })
    .catch(err => {
      result.textContent = err.message;
      loading(false);
    });
  }
}

function copyText() {
  console.log("Region [0][13] - copyText");
  let result = document.getElementById('papagoExt-result-text');
  navigator.clipboard.writeText(result.textContent);
  copied(this);
}

function copied(copyButton) {  
  console.log("Region [0][14] - copied");
  let div = document.createElement('div');
  div.textContent = browser.i18n.getMessage('copied');
  div.style = 'position: absolute; overflow: hidden; animation: fade 2s ease-in;';
  div.style.right = copyButton.offsetWidth + 15 + 'px';
  div.style.top = copyButton.offsetTop + 5 + 'px';

  copyButton.parentElement.insertBefore(div, copyButton);
  setTimeout(() => div.remove(), 1900);
}

// Runtime messages to background script
async function sendTranslate(sourceLang, targetLang, text) {
  console.log("Region [0][15] - sendTranslate");
  return browser.runtime.sendMessage({
    action: 'translate',
    query: `source=${sourceLang}&target=${targetLang}&text=${text}&honorific=true`
  })
}

async function sendDetect(selectedSpeaker, text) {
  console.log("Region [0][16] - sendDetect");
  // console.log(`Region [0][16] - sendDetect - ${targetLang} => ${text}`);
  console.log(`Region [0][16] - sendDetect <>>> speaker=${selectedSpeaker}&text=${text}`);
  return browser.runtime.sendMessage({
    action: 'read',
    query: `speaker=${selectedSpeaker}&text=${text}`
  })
}

// async function sendDetect(targetLang, text) {
//   console.log("Region [0][16] - sendDetect");
//   console.log(`Region [0][16] - sendDetect - ${targetLang} => ${text}`);
//   return browser.runtime.sendMessage({
//     action: 'detect',
//     query: `target=${targetLang}&text=${text}&honorific=true`
//   })
// }

function getPageXOffset() {
  console.log("Region [0][17] - getPageXOffset");
  return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
}

function getPageYOffset() {
  console.log("Region [0][18] - getPageYOffset");
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function playerIcon() {
  let image = document.createElement('#player-logo');
  image.style = `background-image: url(${browser.runtime.getURL('icons/19.png')}); height: 50px; width: 50px;`;
}

const contentHTML = `
  <div class="papagoExt-flex-column" id="papagoExt-blur">
    <div class="papagoExt-flex papago-draggable">
      <select name="papagoExt-target" class="papagoExt-bordered" id="papagoExt-language-target">
        <option id="papagoExt-clara" value="clara">Clara</option>
        <option id="papagoExt-matt" value="matt">Matt</option>
        <option id="papagoExt-djoey" value="djoey">D.Joey</option>
        <option id="papagoExt-danna" value="danna">Danna</option>
      </select>
      <div class="papagoExt-bordered" id="papagoExt-copy-button" style="display:none">Copy</div>
    </div>
    <!-- Inserted Section Start -->

    <div id="layer-1"style="flex-direction: row;display: flex;">
      <div style="display: flex; /*border-radius: 10px;*/ border-top-left-radius; background: #002b48;  border-bottom-left-radius: 10px; border-top-left-radius: 10px;">
        <img id="player-logo" src="${browser.runtime.getURL('icons/64.png')}" k="./icons/64.png">
      </div>
      <div style="display: flex; border-radius: 10px; background: #002b48;">
        <audio style="display: flex; background-color: #338199; border-top-right-radius: 5px; border-bottom-right-radius: 2px; /*border-top-left-radius: 7px;*/" id="audio-tag" src="http://localhost:8008/test1.mp3" autoplay="" controls=""></audio>
      </div>
    </div>

    <!-- Inserted Section Stop -->
    <div class="papagoExt-bordered" id="papagoExt-result-text" style="display:none"></div>
    <div class="papagoExt-flex" id="papagoExt-links" style="display:none !important;">
      <span onclick="window.open('https://www.patreon.com/translating_with_papago', '_blank')" id="papagoExt-donate">Support This Extension</span>
    </div>
  </div>
  <div id="papagoExt-loader">
    <div id="papagoExt-loading-animation"></div>
  </div>
`;
