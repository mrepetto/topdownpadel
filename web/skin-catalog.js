'use strict';
// Roster IDs match selection.js, in the original simulation order.
globalThis.PadelSkins=(()=>{
 const catalog=[
 [
  {
   "name": "Crown Club",
   "primary": "#203e3d",
   "accent": "#ddbd7c",
   "motif": "crown",
   "src": "/skin-cesar-1.webp",
   "thumb": "/skin-cesar-1-head.webp"
  },
  {
   "name": "Centurion",
   "primary": "#78352d",
   "accent": "#cfa662",
   "motif": "crest",
   "src": "/skin-cesar-2.webp",
   "thumb": "/skin-cesar-2-head.webp"
  },
  {
   "name": "Atlas Prime",
   "primary": "#302e45",
   "accent": "#edbb57",
   "motif": "stone",
   "src": "/skin-cesar-3.webp",
   "thumb": "/skin-cesar-3-head.webp"
  }
 ],
 [
  {
   "name": "Grand Tour",
   "primary": "#16577c",
   "accent": "#ffb843",
   "motif": "stripe",
   "src": "/skin-quique-1.webp",
   "thumb": "/skin-quique-1-head.webp"
  },
  {
   "name": "Ronin",
   "primary": "#7a3931",
   "accent": "#e4c285",
   "motif": "blade",
   "src": "/skin-quique-2.webp",
   "thumb": "/skin-quique-2-head.webp"
  },
  {
   "name": "Tempest Fox",
   "primary": "#cbdde4",
   "accent": "#355ddd",
   "motif": "bolt",
   "src": "/skin-quique-3.webp",
   "thumb": "/skin-quique-3-head.webp"
  }
 ],
 [
  {
   "name": "Switchback",
   "primary": "#46543d",
   "accent": "#efc375",
   "motif": "ridge",
   "src": "/skin-carlos-1.webp",
   "thumb": "/skin-carlos-1-head.webp"
  },
  {
   "name": "Undertow",
   "primary": "#17283d",
   "accent": "#45d6cd",
   "motif": "wave",
   "src": "/skin-carlos-2.webp",
   "thumb": "/skin-carlos-2-head.webp"
  },
  {
   "name": "Leviathan",
   "primary": "#193644",
   "accent": "#f27655",
   "motif": "fin",
   "src": "/skin-carlos-3.webp",
   "thumb": "/skin-carlos-3-head.webp"
  }
 ],
 [
  {
   "name": "Shorebreak",
   "primary": "#145463",
   "accent": "#FA8555",
   "motif": "surf",
   "src": "/skin-albert4-1.webp",
   "thumb": "/skin-albert4-1-head.webp"
  },
  {
   "name": "Sharkskin",
   "primary": "#476776",
   "accent": "#A2E7E5",
   "motif": "fin",
   "src": "/skin-albert4-2.webp",
   "thumb": "/skin-albert4-2-head.webp"
  },
  {
   "name": "Bathys",
   "primary": "#23483C",
   "accent": "#DCA750",
   "motif": "diver",
   "src": "/skin-albert4-3.webp",
   "thumb": "/skin-albert4-3-head.webp"
  }
 ],
 [
  {
   "name": "Refugio",
   "primary": "#B64C26",
   "accent": "#D6DC96",
   "motif": "summit",
   "src": "/skin-jordi-1.webp",
   "thumb": "/skin-jordi-1-head.webp"
  },
  {
   "name": "Alpine Ibex",
   "primary": "#345E53",
   "accent": "#D09B61",
   "motif": "horn",
   "src": "/skin-jordi-2.webp",
   "thumb": "/skin-jordi-2-head.webp"
  },
  {
   "name": "Faultline",
   "primary": "#494741",
   "accent": "#EF882F",
   "motif": "magma",
   "src": "/skin-jordi-3.webp",
   "thumb": "/skin-jordi-3-head.webp"
  }
 ],
 [
  {
   "name": "Grandmaster",
   "primary": "#EEF0DD",
   "accent": "#282F3B",
   "motif": "check",
   "src": "/skin-albert6-1.webp",
   "thumb": "/skin-albert6-1-head.webp"
  },
  {
   "name": "Night Gambit",
   "primary": "#483861",
   "accent": "#B2ABDA",
   "motif": "chess",
   "src": "/skin-albert6-2.webp",
   "thumb": "/skin-albert6-2-head.webp"
  },
  {
   "name": "Onyx Rook",
   "primary": "#292E3C",
   "accent": "#E2CF94",
   "motif": "tower",
   "src": "/skin-albert6-3.webp",
   "thumb": "/skin-albert6-3-head.webp"
  }
 ],
 [
  {
   "name": "Highline",
   "primary": "#bd312c",
   "accent": "#fff1dd",
   "motif": "alpine chevron",
   "src": "/skin-abel-1.webp",
   "thumb": "/skin-abel-1-head.webp"
  },
  {
   "name": "Golden Ibex",
   "primary": "#a86c16",
   "accent": "#272a25",
   "motif": "ram horns",
   "src": "/skin-abel-2.webp",
   "thumb": "/skin-abel-2-head.webp"
  },
  {
   "name": "Summit Golem",
   "primary": "#a99e8e",
   "accent": "#bb4e2f",
   "motif": "stone seams",
   "src": "/skin-abel-3.webp",
   "thumb": "/skin-abel-3-head.webp"
  }
 ],
 [
  {
   "name": "Club Captain",
   "primary": "#762e42",
   "accent": "#e5d9bb",
   "motif": "stripe",
   "src": "/skin-david-1.webp",
   "thumb": "/skin-david-1-head.webp"
  },
  {
   "name": "Alpine Guide",
   "primary": "#385f4d",
   "accent": "#ff8238",
   "motif": "summit",
   "src": "/skin-david-2.webp",
   "thumb": "/skin-david-2-head.webp"
  },
  {
   "name": "Stoneguard",
   "primary": "#596674",
   "accent": "#52d4cd",
   "motif": "shard",
   "src": "/skin-david-3.webp",
   "thumb": "/skin-david-3-head.webp"
  }
 ],
 [
  {
   "name": "Riptide Patrol",
   "primary": "#172e51",
   "accent": "#f06433",
   "motif": "rescue stripe",
   "src": "/skin-jon-1.webp",
   "thumb": "/skin-jon-1-head.webp"
  },
  {
   "name": "Hammerhead",
   "primary": "#4c7398",
   "accent": "#a8cee6",
   "motif": "shark fin",
   "src": "/skin-jon-2.webp",
   "thumb": "/skin-jon-2-head.webp"
  },
  {
   "name": "Abyss Diver",
   "primary": "#38404a",
   "accent": "#26ddde",
   "motif": "brass porthole",
   "src": "/skin-jon-3.webp",
   "thumb": "/skin-jon-3-head.webp"
  }
 ],
 [
  {
   "name": "Night Shift",
   "primary": "#292831",
   "accent": "#e94798",
   "motif": "slash",
   "src": "/skin-igor-1.webp",
   "thumb": "/skin-igor-1-head.webp"
  },
  {
   "name": "Road Hound",
   "primary": "#783643",
   "accent": "#bec7c9",
   "motif": "tread",
   "src": "/skin-igor-2.webp",
   "thumb": "/skin-igor-2-head.webp"
  },
  {
   "name": "Hellhound",
   "primary": "#363239",
   "accent": "#ec514b",
   "motif": "fang",
   "src": "/skin-igor-3.webp",
   "thumb": "/skin-igor-3-head.webp"
  }
 ],
 [
  {
   "name": "Pit Crew",
   "primary": "#f3deba",
   "accent": "#ff8c26",
   "motif": "spark",
   "src": "/skin-martin-1.webp?v=padel-pose2",
   "thumb": "/skin-martin-1-head.webp?v=padel-pose2"
  },
  {
   "name": "Yaguareté",
   "primary": "#254a30",
   "accent": "#edaf3c",
   "motif": "claw",
   "src": "/skin-martin-2.webp?v=padel-pose2",
   "thumb": "/skin-martin-2-head.webp?v=padel-pose2"
  },
  {
   "name": "Ironclad",
   "primary": "#383d44",
   "accent": "#ffbc20",
   "motif": "pulse",
   "src": "/skin-martin-3.webp?v=padel-pose2",
   "thumb": "/skin-martin-3-head.webp?v=padel-pose2"
  }
 ],
 [
  {
   "name": "Sandlot Coach",
   "primary": "#656c45",
   "accent": "#f3a154",
   "motif": "diamond",
   "src": "/skin-cristian-1.webp",
   "thumb": "/skin-cristian-1-head.webp"
  },
  {
   "name": "Cloud Courier",
   "primary": "#476c91",
   "accent": "#f4ca80",
   "motif": "wing",
   "src": "/skin-cristian-2.webp",
   "thumb": "/skin-cristian-2-head.webp"
  },
  {
   "name": "Astral Pilot",
   "primary": "#d9e2e6",
   "accent": "#ed792b",
   "motif": "orbit",
   "src": "/skin-cristian-3.webp",
   "thumb": "/skin-cristian-3-head.webp"
  }
 ],
 [
  {
   "name": "Boardwalk",
   "primary": "#f27759",
   "accent": "#34cfca",
   "motif": "wave",
   "src": "/skin-xavi-1.webp",
   "thumb": "/skin-xavi-1-head.webp"
  },
  {
   "name": "Manta Ray",
   "primary": "#17577b",
   "accent": "#b6e0ed",
   "motif": "fin",
   "src": "/skin-xavi-2.webp",
   "thumb": "/skin-xavi-2-head.webp"
  },
  {
   "name": "Breakwater",
   "primary": "#405f72",
   "accent": "#ff7d34",
   "motif": "crest",
   "src": "/skin-xavi-3.webp",
   "thumb": "/skin-xavi-3-head.webp"
  }
 ],
 [
  {
   "name": "Volley Lab",
   "primary": "#74dec9",
   "accent": "#fafcfa",
   "motif": "utility panels",
   "src": "/skin-jeni-1.webp",
   "thumb": "/skin-jeni-1-head.webp"
  },
  {
   "name": "Aurora Pilot",
   "primary": "#372e7b",
   "accent": "#60ecd3",
   "motif": "aurora stripe",
   "src": "/skin-jeni-2.webp",
   "thumb": "/skin-jeni-2-head.webp"
  },
  {
   "name": "Polar Comet",
   "primary": "#e8ecfa",
   "accent": "#3455bc",
   "motif": "swept helmet",
   "src": "/skin-jeni-3.webp",
   "thumb": "/skin-jeni-3-head.webp"
  }
 ],
 [
  {
   "name": "Coastguard",
   "primary": "#193746",
   "accent": "#ff7549",
   "motif": "wave",
   "src": "/skin-laura-1.webp",
   "thumb": "/skin-laura-1-head.webp"
  },
  {
   "name": "Peregrine",
   "primary": "#473763",
   "accent": "#abd7de",
   "motif": "feather",
   "src": "/skin-laura-2.webp",
   "thumb": "/skin-laura-2-head.webp"
  },
  {
   "name": "Solar Flare",
   "primary": "#913630",
   "accent": "#ffc55b",
   "motif": "flare",
   "src": "/skin-laura-3.webp",
   "thumb": "/skin-laura-3-head.webp"
  }
 ],
 [
  {
   "name": "Backbeat",
   "primary": "#db2678",
   "accent": "#faf0f2",
   "motif": "varsity stripes",
   "src": "/skin-rosalia-1.webp",
   "thumb": "/skin-rosalia-1-head.webp"
  },
  {
   "name": "Nightingale",
   "primary": "#41365a",
   "accent": "#a376ef",
   "motif": "swept feathers",
   "src": "/skin-rosalia-2.webp",
   "thumb": "/skin-rosalia-2-head.webp"
  },
  {
   "name": "Eclipse Regent",
   "primary": "#24212b",
   "accent": "#f4bd57",
   "motif": "eclipse crescent",
   "src": "/skin-rosalia-3.webp",
   "thumb": "/skin-rosalia-3-head.webp"
  }
 ],
 [
  {
   "name": "Vinyl Club",
   "primary": "#632537",
   "accent": "#F0A06E",
   "motif": "groove",
   "src": "/skin-trapiche-1.webp",
   "thumb": "/skin-trapiche-1-head.webp"
  },
  {
   "name": "Soundcheck",
   "primary": "#313A54",
   "accent": "#BF67EF",
   "motif": "wave",
   "src": "/skin-trapiche-2.webp",
   "thumb": "/skin-trapiche-2-head.webp"
  },
  {
   "name": "Ultraviolet",
   "primary": "#342952",
   "accent": "#9AE9F0",
   "motif": "resonator",
   "src": "/skin-trapiche-3.webp",
   "thumb": "/skin-trapiche-3-head.webp"
  }
 ],
 [
  {
   "name": "Velódromo",
   "primary": "#284aa2",
   "accent": "#f1e6cc",
   "motif": "racing stripe",
   "src": "/skin-claudia-1.webp",
   "thumb": "/skin-claudia-1-head.webp"
  },
  {
   "name": "Lince Ibérico",
   "primary": "#b78637",
   "accent": "#292421",
   "motif": "lynx spots",
   "src": "/skin-claudia-2.webp",
   "thumb": "/skin-claudia-2-head.webp"
  },
  {
   "name": "Valkiria de Acero",
   "primary": "#7f8995",
   "accent": "#bc2546",
   "motif": "steel wing",
   "src": "/skin-claudia-3.webp",
   "thumb": "/skin-claudia-3-head.webp"
  }
 ]
];
 function get(id,tier){
  if(!Number.isInteger(id)||!Number.isInteger(tier)||tier<1||tier>3)return null;
  return catalog[id]?.[tier-1]||null;
 }
 function tier(id,value){return get(id,value)?value:0;}
 function equipped(id){return tier(id,globalThis.skinLoadout?.(id));}
 // Original kits are included with the player. Secret editions never enter bags.
 const bagWeights=Object.freeze({1:65,2:28,3:7});
 function drawForBag(owned,rng=Math.random){
  const groups=Object.keys(bagWeights).map(Number).map(tier=>({
   tier, ids:catalog.map((_,id)=>id).filter(id=>get(id,tier)&&!owned[id]?.includes(tier))
  })).filter(group=>group.ids.length);
  // A full wardrobe still gets a skin reveal, with no exchange or resale value.
  const repeat=!groups.length;
  if(repeat)for(const tier of Object.keys(bagWeights).map(Number))
   groups.push({tier,ids:catalog.map((_,id)=>id).filter(id=>get(id,tier))});
  const total=groups.reduce((sum,{tier})=>sum+bagWeights[tier],0);
  let roll=rng()*total;
  const group=groups.find(({tier})=>(roll-=bagWeights[tier])<0)||groups[groups.length-1];
  return {id:group.ids[Math.floor(rng()*group.ids.length)],tier:group.tier,repeat};
 }
 return {get,tier,equipped,bagWeights,drawForBag};
})();
