/** Build initial proposal input from source text plus the user's explicit selections.
 * A seed-based/random ABO assignment is NOT treated as a manual selection.
 */
export function buildProfileSetupInput(canon={},overrides={}){
 const build=role=>{
  const source=canon?.[role]||{};
  const fixed=overrides?.[role]||{};
  const setupSelections={};
  for(const key of ['sex','secondary','anatomy','anatomyDetail','pheromoneScent']){
   if(Object.hasOwn(fixed,key))setupSelections[key]=fixed[key];
  }
  return {...source,setupSelections};
 };
 return JSON.stringify({char:build('char'),user:build('user')});
}
