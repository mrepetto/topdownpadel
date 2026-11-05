// Apply the reading floor to legacy screen styles as well as new components.
// Preserve larger headings, zero-sized icon labels, and the cascade (including !important).
const sizeToken=/^(?:-?(?:\d*\.)?\d+(?:px|em|rem|vw|vh|vmin|cqw|cqh|%)|(?:clamp|min|max|calc|var)\()/;
function wrapSize(value){
 const found=value.match(sizeToken);if(!found)return value;
 let end=found[0].length;
 if(found[0].endsWith('(')){
  let depth=1;while(end<value.length&&depth){const c=value[end++];if(c==='(')depth++;if(c===')')depth--;}
 }
 const size=value.slice(0,end);
 return /^0(?:px|em|rem|%)$/.test(size)?value:'max(var(--read-floor,21px), '+size+')'+value.slice(end);
}
export function readableCSS(css){
 return css.replace(/([;{]\s*)(font-size|font)\s*:\s*([^;}]+)/g,(all,start,prop,value)=>{
  const prefix=prop==='font'?(value.match(/^(?:(?:italic|normal|oblique|bold|bolder|[1-9]00)\s+)*/)?.[0]||''):'';
  return start+prop+':'+prefix+wrapSize(value.slice(prefix.length));
 });
}
