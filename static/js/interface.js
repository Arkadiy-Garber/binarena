"use strict";

/**!
 * @module interface
 * @file Interface functions. They add event listeners to DOMs that are
 * predefined in the HTML file (rather than dynamically generated DOMs), and
 * enable pure interface-related actions (not relevant to the content).
 * @description They may directly access the "document" object. They may access
 * the main object that is passed to them.
 */


/**
 * Initialize controls.
 * @function initControls
 * @params {Object} mo - main object
 * @description This is a very long function. It adds event listeners to DOMs
 * except for canvases.
 */
function initControls(mo) {
  resetControls();
  var view = mo.view;
  var stat = mo.stat;


  /**
   * @summary Window
   */

  // window resize event
  window.addEventListener('resize', function () {
    resizeWindow(mo);
  });

  // main frame resize event
  // IE 10 incompatible
  var observer = new MutationObserver(function (mutations) {
    var mutation = mutations[0];
    if (mutation.attributeName !== 'style') return;
    var mf = mutation.target;
    if (mf.id !== 'main-frame') return;
    var w = mf.style.width;
    if (w !== '100%') {
      var w0 = mf.getAttribute('data-width');
      if (!(w0) || w !== w0) {
        mf.setAttribute('data-width', w);
        resizeWindow(mo);
      }
    }
  });
  observer.observe(byId('main-frame'), { attributes: true });

  // window click event
  // hide popup elements (context menu, dropdown selection, etc.)
  window.addEventListener('click', function (e) {
    if (e.button === 0) { // left button

      // hide dropdown divs if event target is not marked as "dropdown"
      var hideDropdown = true;
      var dds = document.getElementsByClassName('dropdown');
      for (var i = 0; i < dds.length; i++) {
        if (dds[i].contains(e.target)) {
          hideDropdown = false;
          break;
        }
      }
      if (hideDropdown) {
        document.querySelectorAll('div.popup, div.menu').forEach(function (div) {
          div.classList.add('hidden');
        });
      }
    }
  });


  /**
   * @summary Context menu
   */

  byId('dash-btn').addEventListener('click', function () {
    this.classList.toggle('active');
    byId('dash-panel').classList.toggle('hidden');
    byId('dash-frame').classList.toggle('active');
  });

  // context menu button click
  byId('menu-btn').addEventListener('click', function () {
    var rect = byId('menu-btn').getBoundingClientRect();
    var menu = byId('context-menu');
    // menu.style.right = 0;
    menu.style.top = rect.bottom + 'px';
    menu.style.left = rect.left + 'px';
    menu.classList.toggle('hidden');
  });

  // open file (a hidden element)
  byId('open-file').addEventListener('change', function (e) {
    uploadFile(e.target.files[0], mo);
  });

  // load data
  byId('load-data-a').addEventListener('click', function () {
    byId('open-file').click();
  });

  byId('show-data-a').addEventListener('click', function () {
    byId('data-table-modal').classList.remove('hidden');
  });

  byId('close-data-a').addEventListener('click', function () {
    mo.data = { cols: [], types: [], dicts: {}, df: [] };
    mo.pick = {};
    mo.mask = {};
    mo.bins = {};
    mo.dist = null;
    updateViewByData(mo);
  });

  byId('export-bins-a').addEventListener('click', function () {
    exportBins(mo.bins, mo.data);
  });

  byId('export-data-a').addEventListener('click', function () {
    exportJSON(mo.data);
  });

  byId('export-image-a').addEventListener('click', function () {
    exportPNG(mo.rena);
  });

  byId('help-a').addEventListener('click', function () {
    byId('help-modal').classList.remove('hidden');
  });


  /**
   * @summary Shared DOMs
   */

  // panel header click (show/hide panel)
  document.querySelectorAll('.panel-head span:last-of-type button').forEach(
    function (btn) {
    btn.addEventListener('click', function () {
      var panel = this.parentElement.parentElement.nextElementSibling;
      if (panel !== null) panel.classList.toggle("hidden");
    });
  });

  // show/hide side frame
  byId('hide-side-btn').addEventListener('click', function () {
    byId('side-frame').classList.add('hidden');
    byId('show-frame').classList.remove('hidden');
    var mf = byId('main-frame');
    mf.style.resize = 'none';
    mf.style.width = '100%';
    resizeArena(mo.rena, mo.oray);
    updateView(mo);
  });

  byId('show-side-btn').addEventListener('click', function () {
    byId('show-frame').classList.add('hidden');
    byId('side-frame').classList.remove('hidden');
    var mf = byId('main-frame');
    mf.style.resize = 'horizontal';
    var w = mf.getAttribute('data-width');
    if (w) mf.style.width = w;
    resizeArena(mo.rena, mo.oray);
    updateView(mo);
  });

  // floating toolbars
  // this is a workaround as I can't find a pure-CSS way
  document.querySelectorAll('.toolbar').forEach(function (bar) {
    var div = bar.parentElement;
    div.addEventListener('mouseenter', function () {
      bar.classList.remove("hidden");
    });
    div.addEventListener('mouseleave', function (e) {
      var rect = bar.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) return;
      bar.classList.add("hidden");
    });
    bar.addEventListener('mouseenter', function () {
      bar.classList.remove("hidden");
    });
    bar.addEventListener('mouseleave', function (e) {
      var rect = div.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) return;
      bar.classList.add("hidden");
    });
  });


  // button groups
  initBtnGroups();

  // close buttons
  initCloseBtns();


  // generic list select table
  // The list select table is like a dropdown menu. It is launched by a source
  // DOM. The user clicks an item, and this code will transfer the selection
  // back to the source DOM and trigger an event of it.
  byId('list-options').addEventListener('click', function (e) {
    var rows = this.rows;
    var n = rows.length;
    for (var i = 0; i < n; i++) {
      if (rows[i].contains(e.target)) {
        var src = byId(this.getAttribute('data-target-id'));
        src.value = rows[i].cells[0].textContent;
        if (src.nodeName.toLowerCase() == 'input') {
          src.focus(); // for text box etc.
        } else {
          src.click(); // for button, menu item, etc.
        }
        this.parentElement.classList.add('hidden');
        break;
      }
    }
  });

  // scale select buttons
  // It is a dropdown menu of various scaling methods.
  var list = byId('scale-select');
  document.querySelectorAll('button.scale-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      byId('current-scale').innerHTML = this.getAttribute('data-scale');
      list.setAttribute('data-target-id', this.id);
      var rect = this.getBoundingClientRect();
      list.style.top = rect.bottom + 'px';
      list.style.left = rect.left + 'px';
      list.classList.toggle('hidden');
    });
  });

  // scale select options
  var table = byId('scale-options');
  for (var i = 0; i < table.rows.length; i++) {
    for (var j = 0; j < table.rows[i].cells.length; j++) {
      var cell = table.rows[i].cells[j];

      // mouse over to show scale name
      cell.addEventListener('mouseover', function () {
        byId('current-scale').innerHTML = this.title;
      });

      // click to select a scale
      cell.addEventListener('click', function () {
        var src = byId(byId('scale-select').getAttribute('data-target-id'));
        if (src.innerHTML !== this.innerHTML) {
          src.innerHTML = this.innerHTML;
          src.setAttribute('data-scale', this.title);
          var item = src.id.split('-')[0];
          displayItemChange(item, byId(item + '-field-sel').value,
            this.title, mo);
        }
      });
    }
  }

  // color palette select button
  byId('palette-btn').addEventListener('click', function () {
    var list = byId('palette-select');
    if (list.classList.contains('hidden')) {
      var val = byId('color-field-sel').value;
      if (!val) return;
      var isNum = (mo.data.types[val] === 'number');
      list.querySelectorAll('.disc').forEach(function (div) {
        div.classList.toggle('hidden', isNum);
      });
      list.querySelectorAll('.cont').forEach(function (div) {
        div.classList.toggle('hidden', !isNum);
      });
      var rect = this.getBoundingClientRect();
      list.style.top = rect.bottom + 'px';
      list.style.left = rect.left + 'px';
      list.classList.remove('hidden');
    } else {
      list.classList.add('hidden');
    }
  });


  /**
   * @summary settings panel
   */

  // display settings
  byId('set-btn').addEventListener('click', function () {
    this.classList.toggle('pressed');
    this.nextElementSibling.classList.toggle('hidden');
  });

  // change length filter
  var btn = byId('len-filt');
  btn.value = mo.view.filter.len;
  btn.addEventListener('blur', function () {
    var val = parseInt(this.value);
    if (val !== mo.view.filter.len) {
      mo.view.filter.len = val;
      toastMsg('Changed contig length threshold to ' + val + '.', mo.stat);
    }
  });

  // change coverage filter
  btn = byId('cov-filt');
  btn.value = mo.view.filter.cov;
  btn.addEventListener('blur', function () {
    var val = parseFloat(this.value);
    if (val != mo.view.filter.cov) {
      mo.view.filter.cov = val;
      toastMsg('Changed contig coverage threshold to ' + val + '.', mo.stat);
    }
  });

  // show/hide grid
  byId('grid-chk').addEventListener('change', function () {
    view.grid = this.checked;
    byId('coords-label').classList.toggle('hidden',
      !this.checked);
    renderArena(mo);
  });

  // show/hide navigation controls
  byId('nav-chk').addEventListener('change', function () {
    byId('nav-panel').classList.toggle('hidden',
      !this.checked);
  });

  // show/hide frequent buttons
  byId('freq-chk').addEventListener('change', function () {
    byId('freq-panel').classList.toggle('hidden',
      !this.checked);
  });



  /**
   * @summary Widget panel buttons
   */

  // draw polygon to select contigs
  byId('polygon-btn').addEventListener('click', function () {
    polygonSelect(mo);
  });

  // toggle selection mode
  byId('selmode-btn').addEventListener('click', function () {
    var modes = ['new', 'add', 'remove'];
    var icons = ['asterisk', 'plus', 'minus'];
    var titles = ['new', 'add to', 'remove from'];
    var i = (modes.indexOf(stat.selmode) + 1) % 3;
    stat.selmode = modes[i];
    this.innerHTML = '<i class="fa fa-' + icons[i] + '"></i>';
    this.title = 'Current selection mode: ' + titles[i] + ' selection';
  });

  // toggle selecting or masking
  byId('masking-btn').addEventListener('click', function () {
    this.classList.toggle('pressed');
    stat.masking = this.classList.contains('pressed');
  });

  // take screenshot
  byId('screenshot-btn').addEventListener('click', function () {
    exportPNG(mo.rena);
  });


  /**
   * @summary Navigation controls
   */

  // reset graph
  byId('reset-btn').addEventListener('click', function () {
    resetView(mo);
  });

  byId('zoomin-btn').addEventListener('click', function () {
    view.scale /= 0.75;
    updateView(mo);
  });

  byId('zoomout-btn').addEventListener('click', function () {
    view.scale *= 0.75;
    updateView(mo);
  });

  byId('left-btn').addEventListener('click', function () {
    view.pos.x -= 15;
    updateView(mo);
  });

  byId('up-btn').addEventListener('click', function () {
    view.pos.y -= 15;
    updateView(mo);
  });

  byId('right-btn').addEventListener('click', function () {
    view.pos.x += 15;
    updateView(mo);
  });

  byId('down-btn').addEventListener('click', function () {
    view.pos.y += 15;
    updateView(mo);
  });


  /**
   * @summary Calculations
   */

  // show calculation menu
  byId('calc-btn').addEventListener('click', function () {
    var menu = byId('calc-menu');
    if (menu.classList.contains('hidden')) {
      var n = Object.keys(mo.bins).length;
      byId('silhouet-a').classList.toggle('disabled', !n);
      byId('adj-rand-a').classList.toggle('disabled', !n);
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
  });

  // calculate silhouette coefficients
  byId('silhouet-a').addEventListener('click', function () {
    if (this.classList.contains('disabled')) return;
    calcSilhouette(mo);
  });

  // calculate adjusted Rand index
  byId('adj-rand-a').addEventListener('click', function () {
    if (this.classList.contains('disabled')) return;
    if (!this.value) {
      listSelect(Object.keys(mo.view.categories).sort(), this, 'right');
    } else {
      calcAdjRand(mo, this.value);
      this.value = null;
      this.parentElement.classList.add('hidden');      
    }
  });


  /**
   * @summary View panel body
   */

  // show/hide legend
  document.querySelectorAll('.legend-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tr = this.parentElement.parentElement.parentElement;
      var legend = tr.nextElementSibling;
      legend.classList.toggle('hidden');
      this.classList.toggle('pressed');
      // have to update legends here, because it relies on visibility
      if (!legend.classList.contains('hidden')) {
        updateLegends(mo, [tr.getAttribute('data-item')]);
      }
    });
  });

  // change display item
  ['x', 'y', 'size', 'opacity', 'color'].forEach(function (key) {
    byId(key + '-field-sel').addEventListener('change', function () {
      byId(key + '-param-span').classList.toggle('hidden', !this.value);
      if (!this.value) {
        var div = byId(key + '-legend');
        if (div) div.parentElement.parentElement.classList.add('hidden');
      }
      displayItemChange(key, this.value, view[key].scale, mo);
    });
  });

  // swap x- and y-axes
  document.querySelectorAll('button.swap-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var xx = mo.view.x;
      var yy = mo.view.y;
      ['i', 'scale', 'min', 'max'].forEach(function (key) {
        xx[key] = [yy[key], yy[key] = xx[key]][0];
      });
      updateCtrlByData(mo.data, mo.view);
      renderArena(mo);
    });
  });

  // populate palettes
  populatePaletteSelect();

  // initialize continuous color map
  mo.view.color.contmap = palette11to101(PALETTES[mo.view.contpal]);

  // select palette
  byId('palette-select').querySelectorAll('table').forEach(
    function (table) {
    for (var i = 0; i < table.rows.length; i++) {
      table.rows[i].addEventListener('click', function () {
        var palette = this.firstElementChild.innerHTML;
        if (this.parentElement.parentElement.parentElement.classList
          .contains('cont')) {
          mo.view.contpal = palette;
          mo.view.color.contmap = palette11to101(PALETTES[palette]);
        } else {
          mo.view.discpal = palette;
          updateColorMap(mo);
        }
        updateLegends(mo, ['color']);
        renderArena(mo);
      });
    }
  });

  // add/remove discrete color
  byId('add-color-btn').addEventListener('click', function () {
    mo.view.ncolor += 1;
    updateColorNum();
  });

  byId('remove-color-btn').addEventListener('click', function () {
    if (mo.view.ncolor === 1) return;
    mo.view.ncolor -= 1;
    updateColorNum();
  });

  function updateColorNum() {
    updateColorMap(mo);
    renderArena(mo);
    updateLegends(mo, ['color']);
  }


  /**
   * @summary Plot panel
   */

  // mini plot aspect: 16:9
  var cav = byId('mini-canvas');
  cav.height = cav.width * 0.5625;

  cav.addEventListener('mousedown', function (e) {
    var rect = this.getBoundingClientRect();
    mo.mini.drag = (e.clientX - rect.left) / (rect.right - rect.left) *
      cav.width;
  });

  cav.addEventListener('mouseup', function () {
    byId('legend-tip').classList.add('hidden');
    if (mo.mini.drag !== null) miniPlotSelect(mo);
  });

  cav.addEventListener('mousemove', function (e) {
    miniPlotMouseMove(e, mo);
  });

  cav.addEventListener('mouseleave', function () {
    if (mo.mini.bin0 !== null) {
      mo.mini.bin0 = null;
      mo.mini.bin1 = null;
      updateMiniPlot(mo);
      byId('legend-tip').classList.add('hidden');
    }
  });

  // plot selected variable
  byId('mini-field-sel').addEventListener('change', function () {
    mo.mini.field = (this.value === '') ? null : this.value;
    updateMiniPlot(mo);
  });

  // log-transform variable
  byId('mini-log-btn').addEventListener('click', function () {
    this.classList.toggle('pressed');
    mo.mini.log = this.classList.contains('pressed');
    updateMiniPlot(mo);
  });

  // increase resolution
  byId('mini-plus-btn').addEventListener('click', function () {
    if (mo.mini.nbin < 50) {
      mo.mini.nbin++;
      updateMiniPlot(mo);
    }
  });

  // decrease resolution
  byId('mini-minus-btn').addEventListener('click', function () {
    if (mo.mini.nbin > 0) {
      mo.mini.nbin--;
      updateMiniPlot(mo);
    }
  });


  /**
   * @summary Legends (in the display panel)
   */

  document.querySelectorAll('.legend').forEach(function (leg) {

    leg.addEventListener('mouseenter', function () {
      this.querySelectorAll('.clip').forEach(function (clip) {
        clip.classList.add('hidden');
      });
    });

    leg.addEventListener('mouseleave', function () {
      this.setAttribute('data-ranging', 'none');
      this.querySelectorAll('.clip').forEach(function (clip) {
        clip.classList.remove('hidden');
      });
    });
  });

  document.querySelectorAll('.gradient').forEach(function (grad) {

    grad.addEventListener('mousemove', function (e) {
      var item = this.parentElement.getAttribute('data-item');
      var v = mo.view[item];
      var rect = this.getBoundingClientRect();
      var width = rect.right - rect.left;
      var offset = e.clientX - rect.left;
      var step = width / 10;
      var ranging = this.parentElement.getAttribute('data-ranging');

      // show tooltip
      if (ranging === 'none') {

        // skip if cursor is outside range
        if (offset < this.parentElement.querySelector('.range.lower')
          .getAttribute('data-tick') * step) return;
        if (offset > this.parentElement.querySelector('.range.upper')
          .getAttribute('data-tick') * step) return;

        // specify tip position
        var tip = byId('legend-tip');
        tip.style.left = e.clientX + 'px';
        tip.style.top = Math.round(rect.bottom) + 'px';

        // specify tip label
        var vmin = v.zero ? 0 : v.min;
        var value = scaleNum(vmin + offset / width * (v.max - vmin),
          unscale(v.scale));
        byId('legend-value').innerHTML = formatValueLabel(
          value, mo.view[item].i, 3, true, mo);

        // item-specific operations
        var circle = byId('legend-circle');
        circle.classList.remove('hidden');
        if (item === 'size') {
          circle.style.backgroundColor = 'black';
          var diameter = Math.ceil(mo.view.rbase * 2 * offset / width);
          circle.style.height = diameter + 'px';
          circle.style.width = diameter + 'px';
        }
        else if (item === 'opacity') {
          circle.style.height = '15px';
          circle.style.width = '15px';
          circle.style.backgroundColor = 'rgba(0,0,0,' + (offset / width)
            .toFixed(2) + ')';
        }
        else if (item === 'color') {
          circle.style.height = '15px';
          circle.style.width = '15px';
          circle.style.backgroundColor = 'rgb(' + mo.view.color.contmap[
            Math.round(offset / width * 100)] + ')';
        }
      }

      // drag to adjust range
      else {
        var tick = Math.round(offset / width * 10);
        var range = this.parentElement.querySelector('.range.' + ranging);
        if (tick == range.getAttribute('data-tick')) return;
        // ensure there's at least one step between lower & upper bounds
        var other = (ranging === 'lower') ? 'upper' : 'lower';
        var space = (this.parentElement.querySelector('.range.' + other)
          .getAttribute('data-tick') - tick) * (1 - ['lower', 'upper']
          .indexOf(ranging) * 2);
        if (space < 1) return;
        range.setAttribute('data-tick', tick);
        range.style.left = Math.round(rect.left + tick * step) + 'px';
      }
    });

    grad.addEventListener('mouseenter', function () {
      if (this.parentElement.getAttribute('data-ranging') === 'none') {
        byId('legend-tip').classList.remove('hidden');
      }
    });

    grad.addEventListener('mouseleave', function () {
      byId('legend-tip').classList.add('hidden');
    });

    grad.addEventListener('mouseup', function () {
      var ranging = this.parentElement.getAttribute('data-ranging');
      if (ranging === 'none') {
        byId('legend-tip').classList.add('hidden');
      } else {
        this.parentElement.setAttribute('data-ranging', 'none');
        var item = this.parentElement.getAttribute('data-item');
        mo.view[item][ranging]= parseInt(this.parentElement.querySelector(
          '.range.' + ranging).getAttribute('data-tick')) * 10;
        renderArena(mo);
        updateLegends(mo, [item]);
      }
    });
  });

  document.querySelectorAll('.legend .range').forEach(function (range) {
    range.title = 'Adjust ' + checkClassName(range, ['lower', 'upper']) +
      ' bound of ' + range.parentElement.getAttribute('data-item');
    range.addEventListener('mousedown', rangeMouseDown);
    range.addEventListener('mouseup', rangeMouseUp);
  });

  function rangeMouseDown(e) {
    e.preventDefault();
    this.parentElement.setAttribute('data-ranging',
      checkClassName(this, ['lower', 'upper']));
  }

  function rangeMouseUp(e) {
    e.preventDefault();
    this.parentElement.setAttribute('data-ranging', 'none');
    var item = this.parentElement.getAttribute('data-item');
    mo.view[item][checkClassName(this, ['lower', 'upper'])]
      = this.getAttribute('data-tick') * 10;
    renderArena(mo);
    updateLegends(mo, [item]);
  }

  document.querySelectorAll('.legend .min').forEach(function (label) {
    label.title = 'Toggle zero or minimum value';
    label.addEventListener('click', function () {
      var item = this.parentElement.getAttribute('data-item');
      mo.view[item].zero = !mo.view[item].zero;
      updateLegends(mo, [item]);
      renderArena(mo);
    });
  });


  /**
   * @summary Search panel
   */

  byId('search-field-sel').addEventListener('change', function (e) {
    searchFieldChange(e, mo.data, view);
  });

  byId('min-btn').addEventListener('click', function () {
    if (this.innerHTML === '[') {
      this.innerHTML = '(';
      this.title = 'Lower bound excluded';
    } else {
      this.innerHTML = '[';
      this.title = 'Lower bound included';
    }
  });

  byId('max-btn').addEventListener('click', function () {
    if (this.innerHTML === ']') {
      this.innerHTML = ')';
      this.title = 'Upper bound excluded';
    } else {
      this.innerHTML = ']';
      this.title = 'Upper bound included';
    }
  });

  ['case-btn', 'whole-btn'].forEach(function (id) {
    byId(id).addEventListener('click', function () {
      this.classList.toggle('pressed');
    });
  });

  ['min-txt', 'max-txt', 'cat-sel-txt', 'fea-sel-txt', 'des-sel-txt']
    .forEach(function (id) {
    byId(id).addEventListener('keyup', function (e) {
      if (e.key === 'Enter') byId('search-btn').click();
    });
  });

  byId('search-btn').addEventListener('click', function () {
    searchByCriteria(mo);
  });


  /**
   * @summary Bins panel controls
   */

  // load bins from a categorical field
  byId('plan-sel-txt').addEventListener('click', function () {
    var cols = Object.keys(view.categories).sort();
    listSelect(['(clear)'].concat(cols), this, 'down', true);
  });

  byId('plan-sel-txt').addEventListener('focus', function () {
    var plan = this.value

    // empty option: unload any binning plan
    if (plan === '(clear)') {
      this.value = '';
      this.setAttribute('data-col', '');
      mo.bins = {};
    }

    // load an existing binning plan
    else {
      var idx = mo.data.cols.indexOf(plan);
      if (idx === -1) return;
      if (idx === this.getAttribute('data-col')) return;
      this.setAttribute('data-col', idx);
      mo.bins = loadBins(mo.data.df, idx);
    }

    // update interface
    updateBinTable(mo);
    updateBinCtrl(mo);
    byId('save-plan-btn').classList.add('hidden');
    var n = Object.keys(mo.bins).length;
    if (n === 0) return;
    toastMsg('Loaded ' + n + ' bins from "' + plan + '".', stat);
  });

  byId('plan-sel-txt').addEventListener('input', function () {
    byId('save-plan-btn').classList.remove('hidden');
  });

  // save current binning plan
  byId('save-plan-btn').addEventListener('click', function () {
    var plan = byId('plan-sel-txt').value;
    if (plan === '') return;
    var bins = mo.bins;
    if (Object.keys(bins).length === 0) {
      toastMsg('Error: The current binning plan has no bin.', stat);
      return;
    }

    // generate a contig-to-bin map
    var df = mo.data.df;
    var map = {};
    var bin, ctg;
    var dups = [];
    for (bin in bins) {
      for (ctg in bins[bin]) {
        if (ctg in map) dups.push(ctg);
        else map[ctg] = bin;
      }
    }

    // report ambiguous assignments
    dups = arrUniq(dups);
    var n = dups.length;
    if (n > 0) {
      treatSelection(dups, 'new', false, mo);
      toastMsg('Error: ' + n + ' contigs were assigned to non-unique bins. '
        + 'They are now selected.', stat);
      return;
    }

    // create a new categorical field
    var idx = mo.data.cols.indexOf(plan);
    n = df.length;
    if (idx === -1) {
      mo.data.cols.push('plan');
      mo.data.types.push('category');
      for (var i = 0; i < n; i++) {
        df[i].push(i in map ? [map[i], null] : null);
      }
      updateCtrlByData(mo.data, mo.view);
      fillDataTable(mo.data, n);
      toastMsg('Saved to new binning plan "' + plan + '".', stat);
    }

    // overwrite an existing categorical field
    else {
      for (var i = 0; i < n; i++) {
        df[i][idx] = (i in map ? [map[i], null] : null);
      }
      updateCtrlByData(mo.data, mo.view);
      fillDataTable(mo.data, n);
      toastMsg('Overwritten binning plan "' + plan + '".', stat);
    }
  });

  // create an empty new bin
  byId('new-empty-bin-btn').addEventListener('click', function () {
    var name = createBin(mo.bins);
    updateBinTable(mo);
    updateBinCtrl(mo);
    var table = byId('bin-tbody');
    selectBin(table, name);
    toastMsg('Created "' + name + '".', stat);
  });

  // delete current bin
  byId('delete-bin-btn').addEventListener('click', function () {
    var table = byId('bin-tbody');
    var deleted = deleteBins(table, mo.bins)[0];
    
    // update interface
    updateBinCtrl(mo);
    var n = deleted.length;
    if (n === 1) toastMsg('Deleted "' + deleted[0] + '".', stat);
    else toastMsg('Deleted ' + n + ' bins.', stat);
  });

  // merge currently selected bins
  byId('merge-bins-btn').addEventListener('click', function () {
    var table = byId('bin-tbody');
    var x = deleteBins(table, mo.bins);
    var name = createBin(mo.bins);
    addToBin(x[1], mo.bins[name]);
    updateBinTable(mo);
    updateBinCtrl(mo);
    selectBin(table, name);
    var n = x[0].length;
    if (n === 2) toastMsg('Merged "' + x[0][0] + '" and "' + x[0][1] +
      '" into "' + name + '".', stat, 2000);
    else toastMsg('Merged ' + n + ' bins into "' + name + '".', stat, 2000);
  });

  // export current binning plan
  byId('export-plan-btn').addEventListener('click', function () {
    exportBins(mo.bins, mo.data);
  });


  /** 
   * @summary Bin table events
   */

  byId('bin-tbody').addEventListener('click', function (e) {
    // prevent table text from being selected
    this.onselectstart = function () {
      return false;
    };
    var rows = this.rows;
    var n = rows.length;
    var selected;
    for (var i = 0; i < n; i++) {
      var row = rows[i];
      var label = row.cells[0].firstElementChild;
      var text = row.cells[0].lastElementChild;
      if (row.contains(e.target)) { // bin being clicked
        if (row.classList.contains('current') &&
          row.cells[0].contains(e.target)) {
          label.classList.add('hidden');
          text.classList.remove('hidden');
          text.focus();
        } else if (row.classList.contains('selected')) {
          row.classList.remove('selected');
          row.classList.remove('current');
        } else {
          row.classList.add('selected');
          row.classList.add('current');
          selected = label.innerHTML;
        }
      } else { // all other bins
        row.classList.remove('current');
        label.classList.remove('hidden');
        text.classList.add('hidden');
        // when Shift is pressed, append instead of replace
        if (!e.shiftKey) row.classList.remove('selected');
      }
    }
    updateBinCtrl(mo);

    // select contigs in bin
    if (selected !== undefined) {
      mo.pick = {};
      for (var i in mo.bins[selected]) mo.pick[i] = null;
      updateSelection(mo);
    }
  });


  /** 
   * @summary Info panel toolbar
   */

  /** 
   * Create a new bin from selected contigs.
   */
  byId('as-new-bin-btn').addEventListener('click', function () {
  
    // if there is no binning plan, create one
    if (Object.keys(mo.bins).length === 0) {
      byId('plan-sel-txt').value = newName(arr2obj(mo.data.cols), 'plan');
    }

    // create a new bin
    var name = createBin(mo.bins);

    // if one or multiple contigs are selected, add them to bin
    var ctgs = Object.keys(mo.pick);
    var n = ctgs.length;
    if (n > 0) {
      addToBin(ctgs, mo.bins[name]);
      mo.pick = {};
      updateSelection(mo);
    }
    updateBinTable(mo);
    updateBinCtrl(mo);
    var table = byId('bin-tbody');
    selectBin(table, name);
    toastMsg('Created "' + name + '"' + (n ? ' with ' + plural('contig', n)
      : '') + '.', stat);
  });


  /** 
   * Add selected contigs to current bin.
   */
  byId('add-to-bin-btn').addEventListener('click', function () {
    var table = byId('bin-tbody');
    var [idx, bin] = currentBin(table);
    if (idx == null) return;
    var ctgs = Object.keys(mo.pick);
    if (ctgs.length === 0) return;
    var exist = mo.bins[bin];
    var added = addToBin(ctgs, exist);
    var n = added.length;
    if (n > 0) updateBinRow(table.rows[idx], exist, mo);
    toastMsg('Added ' + plural('contig', n) + ' to "' + bin + '".', stat);
  });


  /** 
   * Remove selected contigs from current bin.
   */
  byId('remove-from-bin-btn').addEventListener('click', function () {
    var table = byId('bin-tbody');
    var [idx, bin] = currentBin(table);
    if (idx == null) return;
    var ctgs = Object.keys(mo.pick);
    if (ctgs.length === 0) return;
    var exist = mo.bins[bin];
    var removed = removeFromBin(ctgs, exist);
    updateBinCtrl(mo);
    var n = removed.length;
    if (n > 0) updateBinRow(table.rows[idx], exist, mo);
    toastMsg('Removed ' + plural('contig', n) + ' from "' + bin + '".', stat);
  });


  /** 
   * Update current bin with selected contigs.
   */
  byId('update-bin-btn').addEventListener('click', function () {
    var table = byId('bin-tbody');
    var [idx, bin] = currentBin(table);
    if (idx == null) return;
    if (Object.keys(mo.pick).length === 0) return;
    mo.bins[bin] = {};
    var ctgs = mo.bins[bin];
    for (var ctg in mo.pick) ctgs[ctg] = null;
    updateBinCtrl(mo);
    var n = Object.keys(ctgs).length;
    updateBinRow(table.rows[idx], ctgs, mo);
    toastMsg('Updated "' + bin + '" (now has ' + plural('contig', n) +
      ').', stat);
  });


  /** 
   * @summary Info table events
   */

  /** 
   * Invert selection.
   */
  byId('invert-btn').addEventListener('click', function () {
    var pick = mo.pick;
    var mask = mo.mask;
    var n = mo.data.df.length;
    var res = [];
    for (var i = 0; i < n; i++) {
      if (!(i in mask) && !(i in pick)) res.push(i);
    }
    mo.pick = {};
    pick = mo.pick;
    n = res.length;
    for (var i = 0; i < n; i++) {
      pick[res[i]] = null;
    }
    treatSelection(res, 'new', false, mo);
  });


  /** 
   * Mask selection.
   */
  byId('mask-btn').addEventListener('click', function () {
    var indices = Object.keys(mo.pick);
    if (indices.length > 0) {
      // switch to "add" mode, then treat deletion
      treatSelection(indices, 'add', true, mo);
    }
  });


  /** 
   * Toggle summary metric (sum or mean).
   */
  byId('info-metric-btn').addEventListener('click', function () {
    var row = byId('info-table').rows[this.parentElement
      .getAttribute('data-row')];
    if (row.getAttribute('data-metric') === 'sum') {
      row.setAttribute('data-metric', 'mean');
      this.innerHTML = '<span style="text-decoration: overline;">' +
        '<i>x</i></span>';
    } else {
      row.setAttribute('data-metric', 'sum');
      this.innerHTML = '&Sigma;<i>x</i>';
    }
    updateInfoRow(row, mo);
  });

  // weight variable by reference
  byId('info-ref-sel').addEventListener('change', function () {
    var row = byId('info-table').rows[this.parentElement
      .parentElement.getAttribute('data-row')];
    row.setAttribute('data-refcol', this.value);
    updateInfoRow(row, mo);
  });

  // plot variable
  byId('info-plot-btn').addEventListener('click', function () {
    var div = this.parentElement;
    var idx = byId('info-table').rows[div.getAttribute('data-row')]
      .getAttribute('data-index');
    mo.mini.field = idx;
    byId('mini-field-sel').value = idx;
    updateMiniPlot(mo);
    var div = byId('mini-canvas').parentElement;
    div.classList.remove('hidden');
  });

  // hide variable
  byId('info-hide-btn').addEventListener('click', function () {
    var div = this.parentElement;
    var row = byId('info-table').rows[div.getAttribute('data-row')];
    div.classList.add('hidden');
    byId('info-table').deleteRow(row.rowIndex);
  });


  /**
   * @summary Mask panel events
   */

  byId('clear-mask-btn').addEventListener('click', function () {
    mo.mask = {};
    updateView(mo);
  });


  /** 
   * @summary Data table events
   */

  byId('load-data-btn').addEventListener('click', function () {
    byId('open-file').click();
  });


  /** 
   * @summary Toast events
   */

  byId('toast-close-btn').addEventListener('click', function () {
    byId('toast').classList.add('hidden');
  });
}


/**
 * Initiate canvas.
 * @function initCanvas
 * @params {Object} mo - main object
 */
function initCanvas(mo) {
  var view = mo.view;
  var stat = mo.stat;
  var rena = mo.rena;
  var oray = mo.oray;

  resizeArena(rena, oray);

  /* mouse events */
  rena.addEventListener('mousedown', function (e) {
    stat.mousedown = true;
    stat.drag.x = e.clientX - view.pos.x;
    stat.drag.y = e.clientY - view.pos.y;
  });

  rena.addEventListener('mouseup', function () {
    stat.mousedown = false;
  });

  rena.addEventListener('mouseover', function () {
    stat.mousedown = false;
  });

  rena.addEventListener('mouseout', function () {
    stat.mousedown = false;
    stat.mousemove = false;
  });

  rena.addEventListener('mousemove', function (e) {
    canvasMouseMove(e, mo);
  });

  rena.addEventListener('mousewheel', function (e) {
    view.scale *= e.wheelDelta > 0 ? (4 / 3) : 0.75;
    updateView(mo);
  });

  rena.addEventListener('DOMMouseScroll', function (e) {
    view.scale *= e.detail > 0 ? 0.75 : (4 / 3);
    updateView(mo);
  });

  rena.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var menu = byId('context-menu');
    menu.style.top = e.clientY + 'px';
    menu.style.left = e.clientX + 'px';
    menu.classList.remove('hidden');
  });

  rena.addEventListener('click', function (e) {
    canvasMouseClick(e, mo);
  });

  /* drag & drop file to upload */
  rena.addEventListener('dragover', function (e) {
    e.preventDefault();
  });

  rena.addEventListener('dragenter', function (e) {
    e.preventDefault();
  });

  rena.addEventListener('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();
    uploadFile(e.dataTransfer.files[0], mo);
  });

  /* keyboard events */
  rena.addEventListener('keydown', function (e) {
    // var t0 = performance.now();
    switch (e.key) {
      case 'Left':
      case 'ArrowLeft':
        byId('left-btn').click();
        break;
      case 'Up':
      case 'ArrowUp':
        byId('up-btn').click();
        break;
      case 'Right':
      case 'ArrowRight':
        byId('right-btn').click();
        break;
      case 'Down':
      case 'ArrowDown':
        byId('down-btn').click();
        break;
      case '-':
      case '_':
        byId('zoomout-btn').click();
        break;
      case '=':
      case '+':
        byId('zoomin-btn').click();
        break;
      case '0':
        byId('reset-btn').click();
        break;
      case 'p':
      case 'P':
        byId('screenshot-btn').click();
        break;
      case 'm':
      case 'M':
        byId('masking-btn').click();
        break;
      case 'Delete':
      case 'Backspace':
        byId('mask-btn').click();
        break;
      case 'Enter':
        polygonSelect(mo);
        break;
      case ' ':
        byId('as-new-bin-btn').click();
        break;
      case '.':
      case '>':
        byId('add-to-bin-btn').click();
        break;
      case ',':
      case '<':
        byId('remove-from-bin-btn').click();
        break;
      case '/':
      case '?':
        byId('update-bin-btn').click();
        e.preventDefault(); // otherwise it will open Firefox quick find bar
        break;
    }
    // var t1 = performance.now();
    // console.log(t1 - t0);
  });
} // end initializing controls


/**
 * Canvas mouse click event.
 * @function canvasMouseClick
 * @param {Object} e - event object
 * @param {Object} mo - main object
 */
function canvasMouseClick(e, mo) {
  var data = mo.data;
  var view = mo.view;
  var stat = mo.stat;
  var rena = mo.rena;

  // mouse up after dragging
  if (stat.mousemove) {
    stat.mousemove = false;
  }
  
  // keep drawing polygon
  else if (stat.drawing) {
    stat.polygon.push({
      x: (e.offsetX - view.pos.x) / view.scale,
      y: (e.offsetY - view.pos.y) / view.scale,
    });
    drawPolygon(mo);
  }

  // determine which contigs are clicked
  else {
    var arr = [];
    var x0 = (e.offsetX - view.pos.x) / view.scale;
    var y0 = (e.offsetY - view.pos.y) / view.scale;
    var masking = (Object.keys(mo.mask).length > 0) ? true : false;
    var df = data.df;
    var n = df.length;

    var datum, idx, radius, r2, x, y, dx, dy, x2y2;
    for (var i = 0; i < n; i++) {
      if (masking && i in mo.mask) continue;
      datum = df[i];
      idx = view.size.i;
      radius = idx ? scaleNum(datum[idx], view.size.scale) * view.rbase /
        view.size.max : view.rbase;
      // var ratio = scaleNum(datum[view.size.i], view.size.scale) *
      //   view.rbase / view.size.max;
      r2 = radius * radius; // this is faster than Math.pow(x, 2)
      x = ((scaleNum(datum[view.x.i], view.x.scale) - view.x.min) /
        (view.x.max - view.x.min) - 0.5) * rena.width;
      y = ((view.y.max - scaleNum(datum[view.y.i], view.y.scale)) /
        (view.y.max - view.y.min) - 0.5) * rena.height;
      dx = x - x0;
      dy = y - y0;
      x2y2 = dx * dx + dy * dy;
      if (x2y2 <= r2) arr.push([i, x2y2]);
    }
    if (!e.shiftKey) mo.pick = {}; // clear selection
    if (arr.length > 0) {
      arr.sort(function (a, b) { return (a[1] - b[1]); });

      // if already selected, remove; else, add to selection
      i = arr[0][0];
      if (i in mo.pick) delete mo.pick[i];
      else mo.pick[i] = null;
    }
    updateSelection(mo);
  }
}


/**
 * Reset all input and select elements.
 * @function resetControls
 * @description I didn't find a way to do this automatically...
 */
function resetControls() {
  document.querySelectorAll('input, select').forEach(function (dom) {
    dom.value = '';
  });
}


/**
 * Window resize event
 * @function resizeWindow
 * @param {Object} mo - main object
 * @description also manually triggered when user resizes main frame
 */
function resizeWindow(mo) {
  var dims = calcArenaDimensions(mo.rena);
  var w = dims[0],
    h = dims[1];
  toastMsg('Plot size: ' + w.toString() + ' x ' + h.toString(), mo.stat);
  clearTimeout(mo.stat.resizing);
  mo.stat.resizing = setTimeout(function () {
    resizeArena(mo.rena, mo.oray);
    updateView(mo);
  }, 250); // redraw canvas after 0.25 sec
}


/**
 * Canvas mouse move event.
 * @function canvasMouseMove
 * @param {Object} e - event object
 * @param {Object} mo - main object
 */
function canvasMouseMove(e, mo) {
  var view = mo.view;
  var stat = mo.stat;
  var rena = mo.rena;
  if (stat.mousedown) {
    stat.mousemove = true;
    view.pos.x = e.clientX - stat.drag.x;
    view.pos.y = e.clientY - stat.drag.y;
    updateView(mo);
  } else {
    var x = ((e.offsetX - view.pos.x) / view.scale / rena.width + 0.5) *
      (view.x.max - view.x.min) + view.x.min;
    var y = view.y.max - ((e.offsetY - view.pos.y) / view.scale /
      rena.height + 0.5) * (view.y.max - view.y.min);
    byId('coords-label').innerHTML = x.toFixed(3) + ',' + y.toFixed(3);
  }
}


/**
 * Initiate button groups.
 * @function initBtnGroups
 */
function initBtnGroups() {
  var groups = document.getElementsByClassName('btn-group');
  for (var i = 0; i < groups.length; i++) {
    var btns = groups[i].getElementsByTagName('button');
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener('click', function () {
        if (!this.classList.contains('pressed')) {
          var btns = this.parentElement.getElementsByTagName('button');
          for (var i = 0; i < btns.length; i++) {
            if (btns[i] !== this) {
              btns[i].classList.remove('pressed');
            }
          }
          this.classList.add('pressed');
        }
      });
    }
  }
}


/**
 * Initiate modal close buttons.
 * @function initCloseBtns
 */
function initCloseBtns() {
  document.querySelectorAll(".modal-head").forEach(function (div) {
    var btn = document.createElement('button');
    btn.innerHTML = '&times;';
    btn.title = 'Close ' + div.textContent.toLowerCase() + ' window';
    btn.addEventListener('click', function () {
      div.parentElement.parentElement.classList.add('hidden');
    });
    div.appendChild(btn);
  });
}


/**
 * Determine the most appropriate position of a popup.
 * @function popupPos
 * @param {Object} source - source DOM
 * @param {Object} target - target DOM
 * @param {string} direc - direction of popup
 * @param {boolean} same - keep same dimension
 * @description By default it pops up toward bottom and right. But if the
 * current position is too close to the right or bottom edge of the browser,
 * it will pop up toward top and/or left.
 */
function popupPos(source, target, direc, same) {
  var th = 0.8;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var ts = target.style;
  var rect = source.getBoundingClientRect();

  // pop up toward right
  if (direc === 'right') {
    ts.left = rect.right + 'px';
    ts.right = '';
    if (same) {
      ts.top = rect.top + 'px';
      ts.height = (rect.top - rect.bottom) + 'px';
    } else if (rect.top <= vh * th) {
      ts.top = rect.top + 'px';
      ts.bottom = '';
    } else {
      ts.top = '';
      ts.bottom = (vh - rect.bottom) + 'px';
    }
  }

  // pop up toward bottom
  else if (direc === 'down') {
    ts.top = rect.bottom + 'px';
    ts.bottom = '';
    if (same) {
      ts.left = rect.left + 'px';
      ts.width = (rect.right - rect.left) + 'px';
    } else if (rect.left <= vw * th) {
      ts.left = rect.left + 'px';
      ts.right = '';
    } else {
      ts.left = '';
      ts.right = (vw - rect.right) + 'px';
    }
  }
}


/**
 * Let user select from a list displayed in a dropdown menu.
 * @function listSelect
 * @param {Object} src - source DOM
 * @param {string[]} lst - list of options
 * @param {string} direc - direction of list expansion
 * @param {boolean} same - keep same dimension
 */
function listSelect(lst, src, direc, same) {
  var div = byId('list-select');
  div.classList.add('hidden');
  popupPos(src, div, direc, same);
  var table = byId('list-options');
  table.setAttribute('data-target-id', src.id);
  table.innerHTML = '';
  lst.forEach(function (itm) {
    var row = table.insertRow(-1);
    var cell = row.insertCell(-1);
    cell.innerHTML = itm;
  });
  div.classList.remove('hidden');
}


/**
 * Get HTML code for scale code
 * @function scale2HTML
 * @param {string} scale - scale code
 * @returns {string} - HTML code
 */
function scale2HTML(scale) {
  var table = byId('scale-options');
  for (var i = 0; i < table.rows.length; i++) {
    for (var j = 0; j < table.rows[i].cells.length; j++) {
      var cell = table.rows[i].cells[j];
      if (cell.title === scale) {
        return cell.innerHTML;
      }
    }
  }
}


/**
 * Display a message in toast.
 * @function toastMsg
 * @param {string} msg - message to display
 * @param {Object} stat - status object
 * @param {number} duration - milliseconds to keep toast visible; if omitted,
 * the default time is 1 sec; set 0 to keep it visible for ever
 * @param {boolean} loading - display loading dots
 * @param {boolean} toclose - display a close button
 */
function toastMsg(msg, stat, duration, loading, toclose) {
  if (duration === undefined) duration = 2000;
  var toast = byId('toast');
  toast.firstElementChild.innerHTML = msg;
  byId('loading-dots').classList.toggle('hidden', !loading);
  byId('toast-close-btn').classList.toggle('hidden', !toclose);
  toast.classList.remove('hidden');
  if (duration) {
    clearTimeout(stat.toasting);
    stat.toasting = setTimeout(function () {
      toast.classList.add('hidden');
      toast.firstElementChild.innerHTML = '';
    }, duration);
  }
}


/**
 * @summary The following functions are for building auto-complete input boxes.
 * Modified based on the W3Schools tutorial:
 * @see {@link https://www.w3schools.com/howto/howto_js_autocomplete.asp}
 */

/**
 * Add auto-complete function to a text box.
 * @function autoComplete
 * @param {Object} inp - input text box
 * @param {*} arr - list of options
 */
 function autoComplete(inp, arr) {
  var focus;

  inp.addEventListener('input', inputEvent);
  function inputEvent(e) {
    var val = e.currentTarget.value;
    if (!val) return false;
    var VAL = val.toUpperCase();
    var l = val.length;
    var lst = [];
    arr.forEach(function (itm) {
      var prefix = itm.substring(0, l);
      if (prefix.toUpperCase() === VAL) {
        lst.push('<strong>' + prefix + '</strong>' + itm.substring(l));
      }
    });
    listSelect(lst, inp, 'down', true);
    focus = -1;
  }

  inp.addEventListener('keydown', keydownEvent);
  function keydownEvent(e) {
    var table = byId('list-options');
    switch (e.key) {
      case 'Down':
      case 'ArrowDown':
        focus ++;
        addActive(table);
        break;
      case 'Up':
      case 'ArrowUp':
        focus --;
        addActive(table);
        break;
      case 'Enter':
        e.preventDefault();
        if (focus > -1) table.rows[focus].cells[0].click();
        break;
    }
  }

  function addActive(table) {
    removeActive(table);
    if (focus >= table.rows.length) focus = 0;
    else if (focus < 0) focus = (table.rows.length - 1);
    table.rows[focus].cells[0].classList.add('active');
  }

  function removeActive(table) {
    for (var i = 0; i < table.rows.length; i++) {
      table.rows[i].cells[0].classList.remove('active');
    }
  }
}


/**
 * Update legends.
 * @function updateLegends
 * @param {Object} mo - main object
 * @param {Array.<string>} [items] - display items to update
 * @todo other items
 */
function updateLegends(mo, items) {
  items = items || ['size', 'opacity', 'color'];
  for (var i = 0; i < items.length; i++) {
    
    var item = items[i];
    var icol = mo.view[item].i;
    if (!icol) continue;

    // discrete colors
    if (item === 'color') {
      var isCat = (mo.data.types[icol] === 'category');
      byId('color-legend').classList.toggle('hidden', isCat);
      byId('color-legend-2').classList.toggle('hidden', !isCat);
      if (isCat) {
        updateColorTable(mo);
        continue;
      }
    }

    // continuous data
    var scale = unscale(mo.view[item].scale);
    var legend = byId(item + '-legend');
    var grad = legend.querySelector('.gradient');
    if (grad === null) continue;
  
    // refresh labels
    ['min', 'max'].forEach(function (key) {
      var label = legend.querySelector('label.' + key);
      var value = scaleNum(mo.view[item][key], scale);
      value = formatValueLabel(value, icol, 3, false, mo);
      label.setAttribute('data-value', value);
      label.innerHTML = (key === 'min' && mo.view[item].zero) ? 0 : value;
    });

    // item-specific operations
    if (item === 'size') updateSizeGradient(mo);
    if (item === 'color') updateColorGradient(mo);

    // position ranges
    var rect = grad.getBoundingClientRect();
    var step = (rect.right - rect.left) / 10;
    var poses = {};
    ['lower', 'upper'].forEach(function (key) {
      poses[key] = legend.querySelector('.range.' + key).getAttribute(
        'data-tick') * step;
      legend.querySelector('.range.' + key).style.left = Math.round(rect.left
        + poses[key]) + 'px';
    });
  
    // position clips
    var clip = legend.querySelector('.clip.lower');
    clip.style.left = Math.round(rect.left) + 'px';
    clip.style.width = Math.floor(poses['lower']) + 'px';
    clip = legend.querySelector('.clip.upper');
    clip.style.left = Math.round(rect.left + poses['upper']) + 'px';
    clip.style.width = Math.ceil(rect.right - rect.left - poses['upper']) + 'px';
  }
}


/**
 * Update gradient in size legend.
 * @function updateSizeGradient
 * @param {Object} mo - main object
 * @description The ladder-shaped gradient is achieved by css borders, which,
 * cannot accept percentage, thus need to be adjusted specifically.
 */
function updateSizeGradient(mo) {
  var rbase = mo.view.rbase;
  var grad = byId('size-gradient');
  grad.style.height = rbase + 'px';
  grad.style.borderTopWidth = rbase + 'px';
  var rect = grad.getBoundingClientRect();
  var width = Math.floor(rect.right - rect.left);
  grad.style.borderRightWidth = width + 'px';
}


/**
 * Update gradient in continuous color legend.
 * @function updateColorGradient
 * @param {Object} mo - main object
 */
function updateColorGradient(mo) {
  var ci = mo.view.color.i;
  if (!ci) return;
  if (mo.data.types[ci] === 'category') return;
  byId('color-gradient').style.backgroundImage =
    'linear-gradient(to right, ' + PALETTES[mo.view.contpal].map(
    function (e) { return '#' + e; }).join(', ') + ')';
}


/**
 * Update table in discrete color legend.
 * @function updateColorTable
 * @param {Object} mo - main object
 */
function updateColorTable(mo) {
  var table = byId('color-table');
  table.innerHTML = '';
  var cmap = mo.view.color.discmap;
  var row, cell, div;

  // row for each category
  for (var cat in cmap) {
    row = table.insertRow(-1);
    cell = row.insertCell(-1);
    div = document.createElement('div');
    div.innerHTML = '&nbsp;';
    div.style.backgroundColor = '#' + cmap[cat];
    cell.appendChild(div);
    cell = row.insertCell(-1);
    cell.innerHTML = cat;
  }

  // row for others & n/a
  row = table.insertRow(-1);
  cell = row.insertCell(-1);
  div = document.createElement('div');
  div.innerHTML = '&nbsp;';
  div.style.backgroundColor = 'black';
  cell.appendChild(div);
  cell = row.insertCell(-1);
  cell.innerHTML = 'Others & N/A';
}


/**
 * Populate palette select box.
 * @function populatePaletteSelect
 */
function populatePaletteSelect() {
  var popup = byId('palette-select');
  popup.querySelectorAll('div').forEach(function (div) {
    var table = document.createElement('table');
    var pals = div.classList.contains('sequ') ? SEQUENTIAL_PALETTES
      : (div.classList.contains('dive') ? DIVERGING_PALETTES
      : QUALITATIVE_PALETTES);

    // create palette list
    pals.forEach(function (pal) {
      var row = table.insertRow(-1);
      var cell = row.insertCell(-1);
      cell.innerHTML = pal;
      cell = row.insertCell(-1);
      var box = document.createElement('div');

      // continuous color
      if (div.classList.contains('cont')) {
        box.innerHTML = '&nbsp;';
        box.style.backgroundImage = 'linear-gradient(to right, ' +
          PALETTES[pal].map(function (e) { return '#' + e; }).join(', ') + ')';
      }

      // discrete color
      else {
        for (var i = 0; i < 8; i++) {
          var span = document.createElement('span');
          span.innerHTML = '&nbsp;';
          span.style.backgroundColor = '#' + PALETTES[pal][i];
          box.appendChild(span);
        }
      }
      cell.appendChild(box);
    });
    div.appendChild(table);
  });
}


/**
 * Format a value to be a label depending on content.
 * @function formatValueLabel
 * @param {number} value - value to format
 * @param {number} icol - column index
 * @param {number} digits - number of digits to keep
 * @param {boolean} unit - whether to keep unit if available
 * @param {Object} mo - main object
 */
function formatValueLabel(value, icol, digits, unit, mo) {
  var ilen = mo.view.spcols.len;
  if (ilen && icol === ilen) {
    var fmtlen = FormatLength(value);
    var res = formatNum(fmtlen[0], digits);
    if (unit) res += ' ' + fmtlen[1];
    return res;
  } else {
    return formatNum(value, digits);
  }
}


/**
 * Load program theme
 * @function loadTheme
 * @returns {Object} theme
 * @description Currently, it reads colors defined in "theme.css".
 */
 function loadTheme() {
  var theme = {};
  theme.selection = getComputedStyle(byId('selection-color')).color;
  theme.polygon = getComputedStyle(byId('polygon-color')).color;
  return theme;
}
