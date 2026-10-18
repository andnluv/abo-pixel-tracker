/* Live-persona synchronization helpers. Pure module to keep switching testable. */
const clone = value => value == null ? value : structuredClone(value);
const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj||{},key);

export function readCurrentPersona(ctx,avatarId,inferExplicit){
 const settings=ctx?.powerUserSettings||{};
 const id=typeof avatarId==='string'&&avatarId.trim()?avatarId.trim():null;
 const personaNames=settings.personas||{};
 const descriptions=settings.persona_descriptions||{};
 const entry=id&&own(descriptions,id)?descriptions[id]:null;
 const description=typeof entry==='string'?entry:
  typeof entry?.description==='string'?entry.description:
  String(settings.persona_description??ctx?.persona_description??ctx?.personaDescription??'');
 const name=id&&typeof personaNames[id]==='string'&&personaNames[id].trim()
  ?personaNames[id]:String(ctx?.name1||'USER');
 return {...inferExplicit(description), name, card:description.slice(0,7000), personaId:id};
}

export function personaIdentity(persona){
 return persona?.personaId ? `avatar:${persona.personaId}` : `name:${persona?.name||'USER'}`;
}

/**
 * Refresh canonical user identity while preserving manual overrides/preferences for
 * a previously-used persona, without copying them into a different persona.
 * Returns {changed,updated} to let the caller redraw/persist at most once.
 */
export function syncPersonaProfile(meta,live){
 if(!meta?.canon||!live)return {changed:false,updated:false};
 meta.personaProfiles??={};
 meta.overrides??={char:{},user:{}};
 meta.overrides.user??={};
 const old=meta.canon.user||{};
 const id=personaIdentity(live);
 const previous=meta.userPersonaIdentity||personaIdentity(old);
 const migrating=!meta.userPersonaIdentity;
 // Pre-v0.3.1 backups have no identity. If the stored name matches the live
 // name, attach the live avatar without losing existing locked fields.
 const sameLegacy=migrating&&String(old.name||'USER')===String(live.name||'USER');
 const changed=previous!==id&&!sameLegacy;
 if(changed){
  meta.personaProfiles[previous]={
   overrides:clone(meta.overrides.user),
   preferences:clone(old.preferences),
   profileInitialized:meta.profileInitialized===true,
  };
  // Older analysis records had no persona tag; associate them with the outgoing
  // persona so USER events cannot leak into a new persona when replayed.
  for(const row of Object.values(meta.ledger||{})){
   if(!row.personaId)row.personaId=previous;
  }
  const restored=meta.personaProfiles[id];
  meta.overrides.user=clone(restored?.overrides)||{};
  meta.canon.user={...live,...(restored?.preferences?{preferences:clone(restored.preferences)}:{})};
  meta.profileInitialized=Boolean(restored?.profileInitialized);
  meta.initialProposal=null;
 }else{
  const saved=old.preferences?{preferences:old.preferences}:{};
  meta.canon.user={...live,...saved};
 }
 meta.userPersonaIdentity=id;
 const updated=changed||migrating||old.name!==live.name||old.card!==live.card||old.personaId!==live.personaId;
 return {changed,updated};
}

function refersToUser(event){
 return ['person','partner','gestator','donor'].some(k=>event?.[k]==='user');
}

/** Current USER is a different person: replay only shared clock/CHAR events from
 * old personas, never their USER physiological state, bonds, or exposures. */
export function filterRowsByPersona(rows,currentIdentity){
 return rows.map(row=>({
  ...row,
  events:(row.events||[]).filter(e=>!row.personaId||row.personaId===currentIdentity||!refersToUser(e)),
 }));
}
