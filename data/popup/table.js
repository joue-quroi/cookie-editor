'use strict';

HTMLElement.prototype.active = function() {
  this.click();
  this.focus();
  this.dispatchEvent(new Event('change', {
    bubbles: true
  }));
};

var table = {
  callbacks: {}
};
table.on = (id, callback) => {
  table.callbacks[id] = table.callbacks[id] || [];
  table.callbacks[id].push(callback);
};
table.emit = (id, data) => (table.callbacks[id] || []).forEach(c => c(data));

table.write = (root, cookie, origin) => {
  if (!root) {
    [root] = document.querySelector('details[open] tbody').add([cookie], origin);
    root.querySelector('input').active();
  }
  root.cookie = cookie;
  root.origin = origin;
  ['name', 'domain', 'expirationDate', 'value'].forEach(n => Object.assign(root.querySelector(`[data-id=${n}]`), {
    textContent: cookie[n],
    title: cookie[n]
  }));
  root.querySelector('[data-id=size]').textContent = cookie.name.length + cookie.value.length;
  root.querySelector('[data-id=httpOnly]').textContent = cookie.httpOnly ? '✓' : '';
  root.querySelector('[data-id=hostOnly]').textContent = cookie.hostOnly ? '✓' : '';
  root.querySelector('[data-id=secure]').textContent = cookie.secure ? '✓' : '';
  root.querySelector('[data-id=session]').textContent = cookie.session ? '✓' : '';
  root.querySelector('[type=radio]').name = origin;

  return root;
};
table.section = (title, open = false) => {
  const root = document.importNode(document.getElementById('hostname').content, true);
  root.querySelector('b').textContent = title;
  root.querySelector('details').open = open;
  const tbody = root.querySelector('tbody');
  const num = root.querySelector('[data-id=number]');
  tbody.count = n => num.textContent = n;
  tbody.first = () => tbody.querySelector('input');
  tbody.add = (list, domain) => {
    const f = document.createDocumentFragment();
    const ce = document.getElementById('cookie');
    list.forEach(cookie => {
      const clone = document.importNode(ce.content, true);
      const tr = clone.querySelector('tr');
      table.write(tr, cookie, domain);
      f.appendChild(clone);
    });
    const trs = [...f.querySelectorAll('tr')];
    tbody.appendChild(f);
    return trs;
  };
  document.getElementById('cookies').appendChild(root);
  return tbody;
};
table.append = tr => tr.parentNode.appendChild(tr);
table.query = (q = '') => document.querySelector('#cookies [data-selected=true]' + (q ? ' ' + q : ''));
table.remove = tr => {
  const ntr = tr.previousElementSibling;
  const tbody = tr.closest('tbody');
  const num = tbody.querySelectorAll('tr').length - 1;
  tbody.count(num);
  tr.remove();

  if (ntr) {
    ntr.querySelector('input').active();
  }
  else {
    table.emit('no-select');
  }
};
document.getElementById('cookies').addEventListener('change', ({target}) => {
  const tr = target.closest('tr');
  table.emit('select', tr);
});
// select on click
document.getElementById('cookies').addEventListener('click', ({target}) => {
  const tr = target.closest('tr.cookie');
  if (tr) {
    const input = tr.querySelector('input');
    if (input !== target) {
      input.active();
    }
  }
});
// change section
document.getElementById('cookies').addEventListener('change', ({target}) => {
  document.querySelectorAll('#cookies [data-selected]').forEach(e => e.dataset.selected = false);
  target.closest('tr').dataset.selected = true;
});
