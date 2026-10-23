// Scene tab display eligibility: never turn unverified snapshots into facts.
export function sceneHasDetails(scene){
 return Boolean(scene && (['posture','contact','vocal','speech'].some(k=>typeof scene[k]==='string'&&scene[k].trim()) || (Array.isArray(scene.play)&&scene.play.some(k=>typeof k==='string'&&k.trim()))));
}
export function hasUsableScene(person){
 return Boolean(person?.scene && person.scene.verified!==false && sceneHasDetails(person.scene));
}
export function hasSceneHistory(person){
 return Array.isArray(person?.recentScenes) && person.recentScenes.length>0;
}
