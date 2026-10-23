/* Read-only catalogue of drug CLASSES explicitly described in the bundled World Info.
 * Do not infer trade names, doses, person-specific medication events, or custom drugs.
 */
const GROUPS = Object.freeze([
  {key:'MED-01', title:'억제·차단', definitions:[
    {needle:/\broutine oral suppressant\s*:/i, title:'일반 경구 억제제', description:'히트·러트 증상을 완화하는 일반 억제제.'},
    {needle:/\blong-acting suppressant\s*:/i, title:'장기 억제제', description:'증상을 장기간 완화하며, 주기·임신에도 영향을 줄 수 있음.'},
    {needle:/\bemergency suppressant\s*:/i, title:'응급 억제제', description:'갑작스러운 증상을 단기간 완화.'},
    {needle:/\bpheromone blocker\s*:/i, title:'페로몬 차단제', description:'외부로 감지되는 페로몬 발산을 줄임.'},
  ]},
  {key:'MED-02', title:'유도·비승인', definitions:[
    {needle:/\bsymptom[- ](?:only|type)\b/i, title:'유사 주기 유도제', description:'히트·러트와 비슷한 증상을 유도.'},
    {needle:/\b(?:genuine cycle-triggering|cycle-type)\b/i, title:'주기 유도제', description:'히트·러트 주기를 실제로 유발하거나 주기 시점을 변경할 수 있음.'},
  ]},
  {key:'MED-02', title:'그 외 월드 인포 약물', definitions:[
    {needle:/\bunlicensed mixed compound\b/i, title:'비승인 혼합약물', description:'세계관에 따라 억제·유도·주기 불안정 등 여러 작용을 나타낼 수 있음.'},
  ]},
  {key:'FERT-03', title:'피임', definitions:[
    {needle:/\bemergency contraception is available\b/i, title:'응급 피임제', description:'피임 없는 성교 후, 임신 가능 사건의 위험도를 낮춤.'},
  ]},
]);
function entriesFromWorldInfo(worldInfo){
  if(!worldInfo || typeof worldInfo!=='object')throw new TypeError('World Info 형식이 올바르지 않습니다.');
  const entries=worldInfo.entries;
  if(!entries || typeof entries!=='object')throw new TypeError('World Info entries가 없습니다.');
  return Object.values(entries).filter(e=>e&&typeof e.comment==='string'&&typeof e.content==='string');
}
export function extractDrugClassesFromWorldInfo(worldInfo){
  const entries=entriesFromWorldInfo(worldInfo);
  const groups=[];
  for(const group of GROUPS){
    const entry=entries.find(e=>e.comment.startsWith(`${group.key} |`));
    if(!entry)continue;
    const items=group.definitions.filter(x=>x.needle.test(entry.content))
      .map(x=>({title:x.title,description:x.description}));
    if(items.length)groups.push({name:group.title,source:group.key,disabled:entry.disable===true,items});
  }
  return {sourceName:String(worldInfo.name||''),groups,count:groups.reduce((n,g)=>n+g.items.length,0)};
}
