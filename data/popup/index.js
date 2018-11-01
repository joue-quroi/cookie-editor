/* globals cookies, table, editor, Resizable */
'use strict';

var args = new URLSearchParams(location.search);
var search = args.get('search') || null;
var tabId = args.get('tabId') || null;
if (tabId) {
  tabId = Number(tabId);
}
document.body.dataset.popup = !tabId && !search;

const init = a => {
  const hostnames = a.map(o => o.origin).filter((h, i, l) => l.indexOf(h) === i);
  const top = a.filter(o => o.top).shift();
  hostnames.forEach(h => {
    const tbody = table.section(h, h === top.origin);
    cookies.all(h).then(cs => {
      tbody.add(cs, h);
      tbody.count(cs.length);
      if (h === top.origin && cs.length) {
        tbody.first().active();
      }
      // when there is no cookie
      if (cs.length === 0 && h === top.origin) {
        editor.origin = top.origin;
        document.getElementById('domain').value = top.hostname;
      }
    });
  });
  // resizing for expanded mode
  if (document.body.dataset.popup === 'false') {
    const resizable = new Resizable(document.getElementById('header'), {
      offset: -3,
      width: 5,
      min: 5,
      persist: true
    });
    resizable.on('draw', () => {
      table.emit('resizing', resizable.array());
    });
    resizable.init();
  }
  // remove loader
  document.getElementById('loading').remove();
};

document.addEventListener('DOMContentLoaded', () => {
  if (search) {
    if (search.indexOf('://') === -1) {
      search = 'http://' + search;
    }
    init([Object.assign(new URL(search), {
      top: true
    })]);
  }
  else {
    chrome.tabs.executeScript(tabId, {
      allFrames: true,
      code: 'Object.assign({top: window.top === window}, document.location);',
      runAt: 'document_start'
    }, a => {
      if (chrome.runtime.lastError) {
        document.getElementById('loading').remove();
        document.getElementById('msg').textContent = chrome.runtime.lastError.message;
      }
      else {
        init(a);
      }
    });
  }
});

table.on('select', tr => {
  editor.attr({
    disabled: false
  }, '[data-cmd=remove]');
  editor.update(tr.cookie, tr.origin);
});
table.on('no-select', () => {
  editor.attr({
    disabled: true
  }, '[data-cmd=remove]');
  editor.update({});
});
table.on('multi-select', cookies => {
  const input = document.querySelector('[data-cmd="export"]');
  input.disabled = cookies.length === 0;
  input.cookies = cookies;
});

editor.create(e => {
  const tbody = e.target.closest('details').querySelector('tbody');
  const origin = e.target.dataset.origin;
  const tr = tbody.add([{
    name: '',
    value: '',
    expirationDate: Date.now() / 1000 + 24 * 60 * 60,
    session: false
  }], origin).shift();
  const input = tr.querySelector('input[type=radio]');
  input.checked = true;
  input.dispatchEvent(new Event('change', {bubbles: true}));
  input.scrollIntoView();
  editor.focus();
});

editor.reset(() => table.query('input').active());
editor.save(() => {
  const {cookie, origin} = editor;
  const nCookie = editor.toObject();

  cookies.replace(origin, cookie, nCookie).then(cookie => {
    const tr = table.write(table.query(), cookie, origin);
    editor.update(cookie, origin);
    // move to the bottom
    table.append(tr);
  }).catch(e => {
    chrome.notifications.create({
      title: chrome.runtime.getManifest().name,
      type: 'basic',
      iconUrl: '/data/icons/48.png',
      message: e.message || e
    }, () => {
      console.log(e);
      // location.reload()
    });
  });
});

editor.remove(() => {
  const items = table.selected();
  if (items.length === 0) {
    const tr = document.querySelector('#cookies input[type=radio]:checked').closest('tr');
    items.push({
      tr,
      cookie: tr.cookie,
      origin: tr.origin
    });
  }
  items.map(({cookie, origin, tr}) => {
    cookies.remove(origin, cookie).then(table.remove(tr));
  });
});
editor.expand(() => chrome.tabs.query({
  active: true,
  currentWindow: true
}, ([tab]) => {
  args.set('tabId', tab.id);
  chrome.tabs.create({
    url: '/data/popup/index.html?' + args.toString()
  }, () => window.close());
}));
editor.export(() => {
  const cookies = document.querySelector('[data-cmd=export]').cookies;
  const text = JSON.stringify(cookies, null, '  ');
  const blob = new Blob([text], {type: 'application/json'});
  const objectURL = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), {
    href: objectURL,
    type: 'application/json',
    download: 'exported-cookies.json'
  }).dispatchEvent(new MouseEvent('click'));
  setTimeout(() => URL.revokeObjectURL(objectURL));
});
