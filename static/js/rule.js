"use strict";

/**!
 * @module rule
 * @file Rules - Smart predictors to determine which elements should be
 * displayed in what behavior.
 * @description Involved lots of human-designed rules. Can be customized to
 * address specific requirements.
 */


/**
 * Check if a string represents a missing value.
 * @function isMissing
 * @param {string} str - string to check
 * @returns {boolean} check result
 * @description This is only a subset of Pandas default missing values.
 * @see {@link https://pandas.pydata.org/docs/reference/api/
 * pandas.read_table.html}
 */
function isMissing(str) {
  const nulls = ['na', 'n/a', 'nan', 'null', ''];
  try {
    str = str.replace(/^[#-]+/, '');
  } catch (e) {
    throw e.message + ' ' + str;
  }
  return nulls.includes(str.toLowerCase());
}


/**
 * Define display items based on data.
 * @function guessDisplayFields
 * @param {Object} mo - main object
 * @throws if x and y cannot be determined
 * @returns {[number, number, ?number, ?number, ?number]} field indices for
 * x, y, size, opacity, color
 * @description Specifically, five display items are to be inferred:
 *    x, y, size, opacity : {idx, factor, scale, min, max}
 * factor is a number to be multiplied.
 * scale can be: null, square, sqrt, cube, cbrt, log, log10, exp, exp10
 * min and max are pre-calculated lower and upper bounds (after scaling).
 *    color : {idx, n, cutoff, palette}
 * n is the top n categories to be colored.
 * Options are: number, category, feature, description.
 */
function guessDisplayFields(mo) {
  const res = {
    x: null,
    y: null,
    size: null,
    opacity: null,
    color: null
  };
  const cols = mo.cols,
        cache = mo.cache;
  const names = cols.names,
        types = cols.types;

  // first, locate x and y (mandatory)
  const xaxes = ['x', 'xaxis', 'x1', 'axis1', 'dim1', 'pc1', 'pca1', 'tsne1',
                 'umap1', 'pcoa1', 'nmds1'];
  const yaxes = ['y', 'yaxis', 'x2', 'axis2', 'dim2', 'pc2', 'pca2', 'tsne2',
                 'umap2', 'pcoa2', 'nmds2'];
  const xyCand = [null, null];
  let name;
  for (let i = 1; i < names.length; i++) {
    if (types[i] !== 'num') continue;
    name = names[i].toLowerCase().replace(/[\s_-]/g, '');
    if (xaxes.indexOf(name) !== -1) {
      xyCand[0] = i;
    } else if (yaxes.indexOf(name) !== -1) {
      xyCand[1] = i;
    }
  }

  // be satisfied if both obtained
  if (xyCand[0] !== null && xyCand[1] !== null) {
    res.x = xyCand[0];
    res.y = xyCand[1];

    // add other items
    res.size = cache.speci.len || null;
    res.opacity = cache.speci.cov || null;
    res.color = guessRankColumn(cols) || cache.speci.gc || null;
  }

  // otherwise, get gc -> coverage -> length
  else {
    const avails = [];
    let icol;
    for (let key of ['gc', 'cov', 'len']) {
      icol = cache.speci[key];
      if (icol) avails.push(icol);
    }
    if (avails.length >= 2) {
      res.x = avails[0];
      res.y = avails[1];
      if (avails.length === 3) {
        res.size = avails[2];
      }
    }
  }
  return res;
}


/**
 * Guess display scales of items.
 * @function guessDisplayScales
 * @param {string[]} mo - main object
 * @returns {Object} display item to scale mapping
 * @description Currently it guesses about two special columns:
 * - length: cubic root
 * - coverage: square root
 */
function guessDisplayScales(mo) {
  const view = mo.view;
  const speci = mo.cache.speci;
  const items = ['x', 'y', 'size', 'opacity', 'color'];
  const res = {};
  let i;
  for (let item of items) {
    i = view[item].i
    if (!i) res[item] = 'none';
    else if (speci.len === i) res[item] = 'cbrt';
    else if (speci.cov === i) res[item] = 'sqrt';
    else res[item] = 'none';
  }
  return res;
}


/**
 * Guess which column represents the "length" property.
 * @function guessLenColumn
 * @param {Object} cols - data object
 * @returns {number} - index of "length" column
 */
function guessLenColumn(cols) {
  const keys = ['length', 'size', 'len', 'bp'];
  return findColumnByKeys(cols, keys, ['num']);
}


/**
 * Guess which column represents the "coverage" property.
 * @function guessCovColumn
 * @param {Object} cols - cols object
 * @returns {number} - index of "coverage" column
 */
function guessCovColumn(cols) {
  const keys = ['coverage', 'cov', 'depth'];
  return findColumnByKeys(cols, keys, ['num']);
}


/**
 * Guess which column represents the "gc" property.
 * @function guessGCColumn
 * @param {Object} cols - cols object
 * @returns {number} - index of "gc" column
 */
function guessGCColumn(cols) {
  const keys = ['gc', 'g+c', 'gc%', 'gc-content', 'gc-ratio'];
  return findColumnByKeys(cols, keys, ['num']);
}


/**
 * Guess which column represents the highest taxonomic rank.
 * @function guessRankColumn
 * @param {Object} cols - cols object
 * @returns {number} - index of high rank column
 */
function guessRankColumn(cols) {
  // ignore kingdom/domain and species
  const keys = ['phylum', 'class', 'order', 'family', 'genus'];
  return findColumnByKeys(cols, keys, ['cat']);
}


/**
 * Find column by keywords.
 * @function findColumnByKeys
 * @param {Object} cols - cols object
 * @param {string[]} keys - keywords
 * @param {string[]} [types=] - valid data types
 * @returns {number} - index of found column, or 0 if not found
 * @description It first attempts whole-word matching; if not found, it will
 * try prefix matching, using a fixed list of delimiters.
 */
function findColumnByKeys(cols, keys, types) {
  const delims = [' ', '/', '_', '.'];
  const n = cols.names.length;
  let type, whole = 0, prefix = 0;
  for (let i = 1; i < n; i ++) {
    type = cols.types[i];
    if (type.endsWith('wt')) continue;
    if (types && types.indexOf(type) === -1) continue;
    let str = cols.names[i].toLowerCase();

    // whole word matching
    if (keys.indexOf(str) !== -1) {
      whole = i;
      break;
    }

    // prefix matching
    if (prefix) continue;
    for (let d of delims) {
      if (keys.indexOf(str.substring(0, str.indexOf(d))) !== -1) {
        prefix = i;
        break;
      };
    }
  }
  return whole ? whole : prefix;
}


/**
 * Guess a proper metric based on column name.
 * @function guessColMetric
 * @param {string[]} col - column name
 * @returns {string} metric
 * @description Options are: none, sum, mean, sumby meanby.
 * e.g., "length" and "genes" => sum
 * e.g., "gc" and "coverage" => meanby (length)
 * @todo Current form is too hard-coded. Needs change.
 */
function guessColMetric(col) {
  let res = 'sum';
  switch(col.toLowerCase()) {
    case 'x':
    case 'y':
      break;
    case 'gc':
    case 'coverage':
      res = 'meanby';
      break;
    case 'silhouette':
      res = 'mean';
      break;
  }
  return res;
}


/**
 * Format a cell as string.
 * @function value2Str
 * @param {*} val - cell value
 * @returns {string} formatted string
 */
function value2Str(val, type) {
  let str = '';
  switch (type) {
    case 'num':
      // val === val is false if val is NaN
      str = (val === val) ? formatNum(val, 5) : '';
      break;
    case 'cat':
      str = val;
      break;
    case 'fea':
      str = val.join(', ');
      break;
    default:
      str = String(val);
  }
  return str;
}


/**
 * Format contig length value.
 * @function FormatLength
 * @param {number} len - length (bp)
 * @returns {Array.<number, string>} number and unit
 */
function FormatLength(len) {
  const abslen = Math.abs(len);
  if (abslen < 999.5) {
    return [len, 'bp'];
  } else if (abslen < 999500) {
    return [len / 1000, 'kb'];
  } else {
    return [len / 1000000, 'Mb'];
  }
}


/**
 * Generate a new name that does not conflict with existing names.
 * @function newName
 * @param {Set} exist - existing names
 * @param {string} prefix - name prefix
 * @returns {string} new name
 * @description Will read like "prefix_#", in which "#" is an incremental
 * integer.
 */
function newName(exist, prefix) {
  let name;
  let i = 1;
  while (true) {
    name = `${prefix}_${i}`;
    if (exist.has(name)) i ++;
    else return name;
  }
}


/**
 * @constant {Object} PLURAL_FORMS - Dictionary of singular to plural
 * transformations.
 */
const PLURAL_FORMS = {};


/**
 * Convert a noun and a number into the appropriate form.
 * @function plural
 * @param {Object} noun - noun
 * @param {string} n - number
 * @returns {string} formatted phrase
 */
function plural(noun, n) {
  if (n <= 1) return n + ' ' + noun;
  else if (noun in PLURAL_FORMS) return n + ' ' + PLURAL_FORMS[noun];
  else return n + ' ' + noun + 's';
}
