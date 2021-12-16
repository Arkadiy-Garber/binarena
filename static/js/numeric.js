"use strict";

/**!
 * @module numeric
 * @file Numeric calculation functions, involving arrays, matrices,
 * combination, etc.
 */


/**
 * Calculate both min and max of a numeric array.
 * Better performance comparing to Math.min + Math.max.
 * @function arrMinMax
 * @param {number[]} arr - input array
 * @returns {[number, number]} min and max
 */
function arrMinMax(arr) {
  var val = arr[0];
  var min = val;
  var max = val;
  var n = arr.length;
  for (var i = 1; i < n; i++) {
    var val = arr[i];
    min = (val < min) ? val : min;
    max = (val > max) ? val : max;
  }
  return [min, max];
}


/**
 * Calculate both min and max of a object with numeric values.
 * @function objMinMax
 * @param {Object.<string, number>} obj - input object
 * @returns {[[string, number], [string, number]]} min and max key-value pairs
 */
function objMinMax(obj) {
  var arr = Object.keys(obj);
  var key = arr[0]
  var val = obj[key];
  var min = [key, val];
  var max = [key, val];
  var n = arr.length;
  for (var i = 1; i < n; i++) {
    key = arr[i];
    val = obj[key];
    min = (val < min[1]) ? [key, val] : min;
    max = (val > max[1]) ? [key, val] : max;
  }
  return [min, max];
}


/**
 * Calculate sum of numbers in an array.
 * @function arrSum
 * @param {number[]} arr - input array
 * @returns {number} sum
 */
function arrSum(arr) {
  var sum = 0;
  var n = arr.length;
  for (var i = 0; i < n; i++) {
    sum += arr[i];
  }
  return sum;
}


/**
 * Calculate the average of all elements in the input array.
 * @function arrMean
 * @param {number[]} arr - input array
 * returns {number} mean
 */
function arrMean(arr) {
  // to avoid floating point err in js
  return (arrSum(arr) * 10) / (arr.length * 10);
}


/**
 * Calculate sum of products of paired numbers in two arrays.
 * @function arrProdSum
 * @param {number[]} arr1 - input array
 * @param {number[]} arr2 - input array
 * @returns {number} sum of products
 */
function arrProdSum(arr1, arr2) {
  var sum = 0;
  var n = arr1.length;
  for (var i = 0; i < n; i++) {
    sum += arr1[i] * arr2[i];
  }
  return sum;
}


/**
 * Recursively check whether two arrays are equal.
 * @function arrEqual
 * @param {number[]} arr1 - input array
 * @param {number[]} arr2 - input array
 * @return {boolean} true if input arrays are equal, false otherwise 
 */
function arrEqual(arr1, arr2) {
  if (arr1 instanceof Array && arr2 instanceof Array) {
    var n = arr1.length;
    if (n !== arr2.length) {
      return false;
    }
    for (var i = 0; i < n; i++) {
      if (!arrEqual(arr1[i], arr2[i])) {
        return false;
      }
    }
    return true;
  } else {
    return arr1 == arr2;
  }
}


/**
 * Transpose a 2D array.
 * @function transpose
 * @param {Array.<Array>} df - input 2D array
 * @returns {Array.<Array>} transposed 2D array
 */
function transpose(df) {
  var res = [];
  var m = df[0].length;
  for (var i = 0; i < m; i++) {
    res.push([]);
  }
  var n = df.length;
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < m; j++) {
      res[j].push(df[i][j]);
    }
  }
  return res;
}
  

/**
 * Calculate euclidean distance between two points.
 * @function euclidean
 * @param {number[]} x - coordinate of point x
 * @param {number[]} y - coordinate of point y
 * @return {number} euclidean distance between x and y
 */
function euclidean(x, y) {
  // check x, y
  if (arrEqual(x, y)) {
    return 0;
  }
  var sum = 0;
  var n = x.length;
  for (var i = 0; i < n; i++) {
    sum += (x[i] - y[i]) ** 2;
  }
  return Math.sqrt(sum);
}


/**
 * Return the pairwise distance matrix of each point in the input data array.
 * @function pdist
 * @param {number[]} x - the input data array
 * @return {number[]} distance matrix of the given data
 * @see scipy.spatial.distance.pdist
 * @todo add metrics='euclidean'
 */
 function pdist(arr) {
  var n = arr.length;
  var d = Array(n).fill().map(() => Array(n).fill());
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      if (j === i) {
        d[i][j] = 0;
      } else if (j < i) {
        d[i][j] = d[j][i];
      } else {
        d[i][j] = euclidean(arr[i], arr[j]);
      }
    }
  }
  return d;
}


/**
 * Return the occurrence of each entry in the input data.
 * @function bincount
 * @param {number[]} x - the input data array
 * @return {number[]} the occurrence of each entry in the input data
 * @see numpy.bincount
 */
function bincount(x) {
  var res = Array(Math.max.apply(null, x) + 1).fill(0);
  var l = x.length;
  for (var i = 0; i < l; i++) {
    res[x[i]]++;
  }
  return res;
}


/**
 * Return array of unique elements from the input array.
 * @function unique
 * @param {number[]} arr - the input array
 * @param {boolean} returnInv - if true, return the indices of of the unique
 * array, default to false
 * @return {number[]} the unique array and optional indices of unique array
 * @see numpy.unique
 */
 function unique(arr, returnInv=false) {
  let res = Array.from(new Set(arr));
  if (!returnInv) {
    return res;
  } else {
    let inv = Array(arr.length).fill();
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < res.length; j++) {
        if (arr[i] === res[j]) {
          inv[i] = j;
        }
      }
    }
    return [res, inv];
  }
}


/**
 * Calculate the factorial divided by another factorial iteratively.
 * @function factorial
 * @param {number} n - the input integer
 * @param {number} m - the input integer, default to 1
 * @return {number} the factorial quotient of 2 integers
 */
 function factorial(n, m=1) {
  if (!Number.isInteger(n) || (m != undefined && !Number.isInteger(m))) {
    return 0;
  }
  let res = m;
  for (let i = m + 1; i <= n; i++) {
    res *= i;
  }
  return res;
}


/**
 * Calculate the combination of choosing m iterms from n iterms.
 * @function comb
 * @param {number} n - the input integer
 * @param {number} m - the input integer of elements taken
 * @return {number} the combination of n choose m
 * @see scipy.special.comb
 */
function comb(n, m) {
  if (!Number.isInteger(n) || (m != undefined && !Number.isInteger(m))) {
    return 0;
  }
  return factorial(n, n - m + 1) / factorial(m);
}


/**
 * Generate an identity matrix.
 * @function idMat
 * @param {number} n - size of the matrix
 * @return {number[]} the identity matrix
 * @description An identity matrix is a square matrix with 1 on the diagonal
 * and 0 elsewhere.
 * @see {@link https://en.wikipedia.org/wiki/Identity_matrix}
 * @see numpy.identity
 */
 function idMat(n) {
  var res = Array(n).fill().map(() => Array(n).fill(0));
  for (var i = 0; i < n; i++) {
    res[i][i] = 1;
  }
  return res;
}


/**
 * Compute the inverse of a matrix.
 * @function matInv
 * @param {number[]} x - the input matrix
 * @return {number[]} inverse of the input matrix
 * @see {@link https://en.wikipedia.org/wiki/Invertible_matrix}
 * @see numpy.linalg.inv
 */
 function matInv(x) {
  if (typeof(x) === 'number') {
    return 1 / x;
  }
  let r = x.length;
  let c = x[0].length;
  let a = [];
  for (let i = 0; i < r; i++) { // deep copy the input array
    a[i] = x[i].slice();
  }
  let res = idMat(r);
  let k, Ii, Ij, temp;

  // row reduction
  for (let i = 0; i < c; i++) {
    var idx = i;
    var max = a[i][i];
    for (let j = i; j < r; j++) {
      let cur = Math.abs(a[j][i]);
      if (cur > max) { // find max element and its index in the ith column
        idx = j;
        max = cur;
      }
    }

    // row exchange
    if (idx !== i) {
      temp = a[idx];
      a[idx] = a[i];
      a[i] = temp;
      temp = res[idx];
      res[idx] = res[i];
      res[i] = temp;
    }
    let Aj = a[i];
    let Ij = res[i];

    let f = Aj[i];
    for (let j = i; j < c; j++) {
      Aj[j] /= f;
    }
    for (let j = 0; j < c; j++) {
      Ij[j] /= f;
    }

    // eleminate non-zero values on other rows at column c
    for (let j = 0; j < r; j++) {
      if (j !== i) {
        let Ai = a[j];
        Ii = res[j];
        f = Ai[i];
        for (k = i + 1; k < c; k++) {
          Ai[k] -= Aj[k] * f;
        }
        for (k = c - 1; k > 0; k--) {
          Ii[k] -= Ij[k] * f;
          k--;
          Ii[k] -= Ij[k] * f;
        }
        if (k===0) {
          Ii[0] -= Ij[0] * f;
        }
      }
    }
  }
  return res;
}
