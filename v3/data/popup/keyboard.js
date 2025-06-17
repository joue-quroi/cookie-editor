'use strict';

document.addEventListener('keydown', e => {
  const meta = e.metaKey || e.ctrlKey;
  const {code} = e;

  if (code === 'KeyF' && meta) {
    e.preventDefault();
    e.stopPropagation();

    document.getElementById('cookie-filter').focus();
    document.getElementById('cookie-filter').select();
  }
});
document.addEventListener('keyup', e => {
  const {code} = e;

  if (code === 'Delete') {
    e.preventDefault();
    e.stopPropagation();

    document.querySelector('[data-cmd=remove]').click();
  }
  else if (code === 'Enter') {
    if (e.target.type === 'search') {
      // find the first visible row
      const tr = document.querySelector('#cookies tr:not(.hidden)');
      if (tr) {
        tr.click();
      }
    }
    else if (document.getElementById('save').disabled) {
      e.preventDefault();
      e.stopPropagation();

      document.getElementById('name').focus();
    }
  }
});
