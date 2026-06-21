// js/utils/helpers.js

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function el(id) {
  return document.getElementById(id);
}

function show(id) { el(id).style.display = ''; }
function hide(id) { el(id).style.display = 'none'; }