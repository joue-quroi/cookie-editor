/* globals cookies, table, editor */
'use strict';

const init = () => chrome.tabs.executeScript({
  allFrames: true,
  code: 'Object.assign({top: window.top === window}, document.location);',
  runAt: 'document_start'
}, a => {
  //
  document.getElementById('loading').remove();
  //
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }
  else {
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
  }
});

document.addEventListener('DOMContentLoaded', () => window.setTimeout(init, 500));

table.on('select', tr => {
  editor.attr({
    disabled: false
  }, 'remove');
  editor.update(tr.cookie, tr.origin);
});
table.on('no-select', () => {
  editor.attr({
    disabled: true
  }, 'remove');
  editor.update({});
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
      //location.reload()
    });
  });
});
editor.remove(() => {
  const {origin, cookie} = editor;
  cookies.remove(origin, cookie).then(() => {
    table.remove(table.query());
  });
});
